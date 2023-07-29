"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_events_1 = require("node:events");
const aoi_db_1 = require("@akarui/aoi.db");
const structures_1 = require("@akarui/structures");
const functions_js_1 = __importDefault(require("./functions.js"));
class InviteManager extends node_events_1.EventEmitter {
    #client;
    db;
    options;
    invites;
    readyAt = -1;
    constructor(client, dbOptions) {
        super();
        this.options = {
            fakeLimit: 2 * 7 * 24 * 60 * 60 * 1000,
        };
        this.#client = client;
        this.invites = new structures_1.Group(Infinity);
        this.db = new aoi_db_1.KeyValue({
            dataConfig: {
                path: "./database",
                tables: ["invites", "inviteCodes"],
            },
            fileConfig: {
                maxSize: 20 * 1024 * 1024,
            },
            encryptionConfig: {
                encriptData: false,
                securityKey: dbOptions.sk,
            },
        });
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    setFakeLimit(limit) {
        this.options.fakeLimit = limit;
    }
    async fetchAllInvites() {
        const guilds = this.#client.guilds.cache;
        for (const guild of guilds.values()) {
            const invites = await guild.invites.fetch().catch((err) => {
                this.#client.emit("error", err);
                return null;
            });
            if (!invites)
                continue;
            const group = new structures_1.Group(Infinity);
            for (const invite of invites.values()) {
                group.set(invite.code, invite);
            }
            this.invites.set(guild.id, group);
        }
    }
    async connect() {
        this.db.connect();
        await this.fetchAllInvites();
        this.#client.on("inviteCreate", (invite) => {
            let group = this.invites.get(invite.guild?.id);
            if (!group)
                group = new structures_1.Group(Infinity);
            group.set(invite.code, invite);
            this.invites.set(invite.guild?.id, group);
        });
        this.#client.on("inviteDelete", (invite) => {
            let group = this.invites.get(invite.guild?.id);
            if (!group)
                return;
            group.delete(invite.code);
            this.invites.set(invite.guild?.id, group);
        });
        this.#client.on("guildCreate", async (guild) => {
            const invites = await guild.invites.fetch().catch((err) => {
                this.#client.emit("error", err);
                return null;
            });
            if (!invites)
                return;
            const group = new structures_1.Group(Infinity);
            for (const invite of invites.values()) {
                group.set(invite.code, invite);
            }
            this.invites.set(guild.id, group);
        });
        this.#client.on("guildDelete", (guild) => {
            this.invites.delete(guild.id);
        });
        this.#client.on("guildMemberAdd", async (member) => {
            await this.memberJoin(member);
        });
        this.#client.on("guildMemberRemove", async (member) => {
            await this.memberLeave(member, member.guild.id);
        });
        this.#client.on("guildBanAdd", async (guildban) => {
            const guildId = guildban.guild.id;
            const getCodeData = (await this.db.findOne("inviteCodes", (data) => {
                const d = data.value.find((x) => x.id === guildban.user.id) && data.key.endsWith(guildId);
                return !!d;
            }))?.value;
            const memData = getCodeData?.find((x) => x.id === guildban.user.id);
            const member = {
                id: guildban.user.id,
                user: guildban.user,
                joinedTimestamp: memData?.join ?? guildban.user.createdTimestamp,
            };
            await this.memberLeave(member, guildId);
        });
        for (const func of functions_js_1.default) {
            if (!func.type)
                func.type = "djs";
            this.#client.functionManager.createFunction(func);
        }
        this.readyAt = Date.now();
    }
    generateinviterData() {
        const data = {
            inviter: "",
            codes: [],
            codeData: {},
            counts: {
                fake: 0,
                total: 0,
                real: 0,
                leave: 0,
            },
        };
        return data;
    }
    async addMemberToDB({ member, inviter, code, guildId, }) {
        let inviterData = (await this.db.get("invites", `${inviter}_${guildId}`))?.value;
        let codeData = (await this.db.get("inviteCodes", `${code}_${guildId}_${inviter}`))?.value;
        if (!inviterData) {
            inviterData = this.generateinviterData();
            inviterData.inviter = inviter;
            inviterData.codes.push(code);
            inviterData.codeData[code] = {
                fake: this.isFakeMember(member) ? 1 : 0,
                total: 1,
                real: this.isFakeMember(member) ? 0 : 1,
                leave: 0,
            };
            inviterData.counts.fake = this.isFakeMember(member) ? 1 : 0;
            inviterData.counts.total = 1;
            inviterData.counts.real = this.isFakeMember(member) ? 0 : 1;
            inviterData.counts.leave = 0;
        }
        else {
            if (!inviterData.codes.includes(code))
                inviterData.codes.push(code);
            if (!inviterData.codeData[code]) {
                inviterData.codeData[code] = {
                    fake: this.isFakeMember(member) ? 1 : 0,
                    total: 1,
                    real: this.isFakeMember(member) ? 0 : 1,
                    leave: 0,
                };
            }
            else {
                inviterData.codeData[code].total++;
                if (this.isFakeMember(member))
                    inviterData.codeData[code].fake++;
                else
                    inviterData.codeData[code].real++;
            }
            inviterData.counts.total++;
            if (this.isFakeMember(member))
                inviterData.counts.fake++;
            else
                inviterData.counts.real++;
        }
        if (!codeData) {
            codeData = [
                {
                    id: member.id,
                    join: member.joinedTimestamp ?? Date.now(),
                    isFake: this.isFakeMember(member),
                },
            ];
        }
        else {
            codeData.push({
                id: member.id,
                join: member.joinedTimestamp ?? Date.now(),
                isFake: this.isFakeMember(member),
            });
        }
        await this.db.set("inviteCodes", `${code}_${guildId}_${inviter}`, {
            value: codeData,
        });
        await this.db.set("invites", `${inviter}_${guildId}`, {
            value: inviterData,
        });
    }
    isFakeMember(member) {
        if (member.user.bot || member.user.system)
            return true;
        const time = Date.now() - member.user.createdTimestamp;
        if (time < this.options.fakeLimit)
            return true;
        return false;
    }
    async getInviterGuildData(inviter, guildId) {
        const data = (await this.db.get("invites", `${inviter}_${guildId}`))
            ?.value;
        if (!data)
            return null;
        return data;
    }
    async getInviterData(inviter) {
        const data = (await this.db.findMany("invites", (data) => {
            return data.key.startsWith(`${inviter}_`);
        }))?.map((data) => data.value);
        if (!data)
            return null;
        return data;
    }
    async getCodeData(code, guildId, inviter) {
        if (inviter) {
            const data = (await this.db.get("inviteCodes", `${code}_${guildId}_${inviter}`))?.value;
            if (!data)
                return null;
            return data;
        }
        else {
            const data = (await this.db.findOne("inviteCodes", (data) => {
                return data.key.startsWith(`${code}_${guildId}_`);
            }))?.value;
            if (!data)
                return null;
            return data;
        }
    }
    async memberJoin(member) {
        const invites = await member.guild.invites.fetch().catch((err) => {
            this.#client.emit("error", err);
            return null;
        });
        if (!invites)
            return;
        const oldInvites = this.invites.get(member.guild.id);
        if (!oldInvites)
            return;
        const newInvite = invites.find((invite) => {
            const oldInvite = oldInvites.get(invite.code);
            if (!oldInvite)
                return false;
            return invite.uses > oldInvite.uses;
        });
        if (!newInvite)
            return;
        this.invites.set(member.guild.id, oldInvites.set(newInvite.code, newInvite));
        const inviter = newInvite.inviterId;
        const code = newInvite.code;
        const guildId = member.guild.id;
        await this.addMemberToDB({
            member,
            inviter,
            code,
            guildId,
        });
        this.emit("inviteJoin", {
            inviter,
            code,
            guildId,
            memberId: member.id,
        });
    }
    async memberLeave(member, guildId) {
        const codeDbData = await this.db.findOne("inviteCodes", (data) => {
            return data.value.includes(member.id) && data.key.endsWith(guildId);
        });
        if (!codeDbData)
            return;
        const codeData = codeDbData.value;
        const code = codeDbData.key.split("_")[0];
        const inviter = codeDbData.key.split("_")[2];
        const inviterData = await this.getInviterGuildData(inviter, guildId);
        if (!inviterData)
            return;
        codeData.splice(codeData.findIndex((data) => data.id === member.id), 1);
        inviterData.counts.leave++;
        inviterData.codeData[code].leave++;
        if (this.isFakeMember(member)) {
            inviterData.codeData[code].fake--;
            inviterData.counts.fake--;
        }
        else {
            inviterData.codeData[code].real--;
            inviterData.counts.real--;
        }
        await this.db.set("inviteCodes", codeDbData.key, {
            value: codeData,
        });
        await this.db.set("invites", `${inviter}_${guildId}`, {
            value: inviterData,
        });
        this.emit("inviteLeave", {
            inviter,
            code,
            memberId: member.id,
            guildId,
        });
    }
    async getInviteeData(id, guildId) {
        const data = await this.db.findOne("inviteCodes", (data) => {
            return data.value.includes(id) && data.key.endsWith(guildId);
        });
        if (!data)
            return null;
        const codeData = data.value;
        const code = data.key.split("_")[0];
        const inviter = data.key.split("_")[2];
        const mem = codeData.find((x) => x.id === id);
        const isFake = mem?.isFake ?? false;
        const join = mem?.join ?? null;
        return {
            code,
            inviter,
            isFake,
            join,
        };
    }
    async resetInvites(guildId, inviter) {
        const inviterData = await this.getInviterGuildData(inviter, guildId);
        if (!inviterData)
            return false;
        const codes = inviterData.codes;
        for (const code of codes) {
            await this.db.delete("inviteCodes", `${code}_${guildId}_${inviter}`);
        }
        await this.db.delete("invites", `${inviter}_${guildId}`);
        return true;
    }
    async resetGuildInvites(guildId) {
        await this.db.deleteMany("inviteCodes", (data) => {
            return data.key.endsWith(guildId);
        });
    }
    async setInviterData(inviter, guildId, data) {
        await this.db.set("invites", `${inviter}_${guildId}`, {
            value: data,
        });
    }
    async getLeaderboard(guildId, page = 1, limit = 10, format) {
        let inviters = await this.db.findMany("invites", (data) => {
            return data.key.endsWith(guildId);
        });
        if (!inviters)
            return null;
        const res = [];
        inviters = inviters
            .sort((a, b) => {
            const aData = a.value;
            const bData = b.value;
            if (aData.counts.total > bData.counts.total)
                return -1;
            if (aData.counts.total < bData.counts.total)
                return 1;
            else {
                if (aData.counts.real > bData.counts.real)
                    return -1;
                if (aData.counts.real < bData.counts.real)
                    return 1;
                else {
                    if (aData.counts.fake < bData.counts.fake)
                        return -1;
                    if (aData.counts.fake > bData.counts.fake)
                        return 1;
                    else {
                        if (aData.counts.leave < bData.counts.leave)
                            return -1;
                        if (aData.counts.leave > bData.counts.leave)
                            return 1;
                        else
                            return 0;
                    }
                }
            }
        })
            .slice((page - 1) * limit, page * limit);
        if (!format)
            return inviters.map((x, y, z) => {
                return {
                    ...x.value,
                    position: z.indexOf(x) + 1,
                };
            });
        let index = 1;
        for (const inviter of inviters) {
            res.push(format
                .replace(/{inviter}/g, inviter.value.inviter)
                .replace(/{total}/g, inviter.value.counts.total.toString())
                .replace(/{real}/g, inviter.value.counts.real.toString())
                .replace(/{fake}/g, inviter.value.counts.fake.toString())
                .replace(/{leave}/g, inviter.value.counts.leave.toString())
                .replace(/{position}/g, (page - 1) * limit + index++ + "")
                .replace(/{invitername}/g, this.#client.users.cache.get(inviter.value.inviter)?.username ?? "Unknown")
                .replace(/{inviternick}/g, this.#client.guilds.cache
                .get(guildId)
                ?.members.cache.get(inviter.value.inviter)?.displayName ?? "Unknown"));
        }
        return res;
    }
}
exports.default = InviteManager;
//# sourceMappingURL=manager.js.map