import { FunctionData } from "./typings.js";

const funcitons: FunctionData[] = [
    {
        name: "$inviteeInfo",
        description: "Returns the invitee's information",
        fields: [
            {
                name: "userId",
                description: "The user's id",
                type: "string",
                required: false,
                default: "<Author>.id",
            },
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                default: "<Guild>.id",
            },
            {
                name: "options",
                description: "The options",
                type: "string",
                required: false,
                default: "all",
            },
        ],
        options: ["all", "inviter", "code", "fake"],
        returns: "string | boolean | object",
        example: `
$inviteeInfo
//or
$inviteeInfo[$authorID;$guildId;inviter]
//or
$getObjectProperty[name;inviter]
$createObject[name;$inviteeInfo[$authorID;$guildID;all]]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [
                userId = d.author?.id,
                guildId = d.guild?.id,
                option = "all",
            ] = data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;
            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            const codeData = await inviteSystem.getInviteeData(userId, guildId);

            const result = codeData ?? {};
            data.result =
                option === "all"
                    ? JSON.stringify(result)
                    : result[option] ?? false;

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$inviterInfo",
        description: "Returns the inviter's information",
        fields: [
            {
                name: "userId",
                description: "The user's id",
                type: "string",
                required: false,
                default: "<Author>.id",
            },
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                default: "<Guild>.id",
            },
            {
                name: "options",
                description: "The options",
                type: "string",
                required: false,
                default: "all",
            },
        ],
        options: [
            "all",
            "codes",
            "counts.< fake | total | real | leave >",
            "codeData.< InviteCode >.< fake | total | real | leave >",
        ],
        returns: "string | boolean | object",
        example: `
$inviterInfo
//or
$inviterInfo[$authorID;$guildId;codes]
//or
$getObjectProperty[name;codes]
$createObject[name;$inviterInfo[$authorID;$guildID;all]]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [
                userId = d.author?.id,
                guildId = d.guild?.id,
                option = "all",
            ] = data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;

            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            const inviterData = await inviteSystem.getInviterData(
                userId,
                guildId,
            );

            const result = inviterData ?? {};

            const options = option.split(".");
            if (option !== "all") {
                let value = result;
                for (const option of options) {
                    value = value?.[option];
                }

                data.result = value ?? null;
            } else {
                data.result = JSON.stringify(result);
            }

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$inviteEventInfo",
        description: "Returns the inviteSystem event's information",
        fields: [
            {
                name: "options",
                description: "The options",
                type: "string",
                required: false,
                default: "all",
            },
        ],
        options: ["all", "inviter", "code", "memberId", "guildId", "error"],
        returns: "string | boolean | object",
        example: `
$inviteEventInfo
//or

$inviteEventInfo[inviter]
//or

$getObjectProperty[name;inviter]
$createObject[name;$inviteEventInfo]
`,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [option = "all"] = data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;

            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            const eventInfo = d.data.eventInfo;

            data.result =
                option === "all"
                    ? JSON.stringify(eventInfo ?? {})
                    : eventInfo[option] ?? null;

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$resetInvites",
        description: "Resets the invites of a user",
        fields: [
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                default: "<Guild>.id",
            },
            {
                name: "userId",
                description: "The user's id",
                type: "string",
                required: false,
                default: "<Author>.id",
            },
        ],
        options: [],
        returns: "void",
        example: `
$resetInvites
//or

$resetInvites[$guildID;$authorID]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [guildId = d.guild?.id, userId = d.author?.id] =
                data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;
            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            await inviteSystem.resetInvites(userId, guildId);

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$resetGuildInvites",
        description: "Resets the invites of a guild",
        fields: [
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                default: "<Guild>.id",
            },
        ],
        options: [],
        returns: "void",
        example: `
$resetGuildInvites
//or

$resetGuildInvites[$guildID]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [guildId = d.guild?.id] = data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;
            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            await inviteSystem.resetGuildInvites(guildId);

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$inviteJoins",
        description: "Returns the member ids who joined with the invite",
        fields: [
            {
                name: "code",
                description: "The invite code",
                type: "string",
                required: true,
            },
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                default: "<Guild>.id",
            },
            {
                name: "separator",
                description: "The separator between the member ids",
                type: "string",
                required: false,
                default: ",",
            },
        ],
        options: [],
        returns: "string[]",
        example: `
$inviteJoins[inviteCode;$guildID]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);
            const [code, guildId = d.guild?.id, separator = ","] =
                data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;
            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            const result = await inviteSystem.getInviteJoins(code, guildId);
            data.result = result?.join(separator);

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$modifyInvite",
        description: "Modifies the invite",
        fields: [
            {
                name: "inviter",
                description: "The inviter's id",
                type: "string",
                required: true,
            },
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: true,
            },
            {
                name: "options",
                description: "The options",
                type: "string",
                required: true,
            },
            {
                name: "value",
                description: "The value",
                type: "any",
                required: true,
            },
        ],
        options: [
            "counts.< fake | real | leave >",
            "codeData.< InviteCode >.< fake | real | leave >",
        ],
        returns: "void",
        example: `
$modifyInvite[$authorID;$guildID;counts.total;10]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [inviter, guildId, option, value] = data.inside.splits;

            if (option.endsWith("total"))
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "Cannot modify total count!",
                );

            const inviteSystem = d.client.AoiInviteSystem;
            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            const inviterData = await inviteSystem.getInviterData(
                inviter,
                guildId,
            );

            if (!inviterData)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "Inviter data not found!",
                );

            const options = option.split(".");
            let dataToModify = inviterData;
            for (const option of options) {
                dataToModify = dataToModify[option];
            }

            if (!dataToModify)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "Data not found!",
                );

            dataToModify = value;

            await inviteSystem.setInviterData(inviter, guildId, inviterData);

            return {
                code: d.util.setCode(data),
            };
        },
    },
    {
        name: "$inviteLeaderboard",
        description: "Returns the invite leaderboard",
        fields: [
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                default: "<Guild>.id",
            },
            {
                name: "page",
                description: "The page number",
                type: "number",
                required: false,
                default: "1",
            },
            {
                name: "limit",
                description: "The limit of the leaderboard",
                type: "number",
                required: false,
                default: "10",
            },
            {
                name: "format",
                description: "The format of the leaderboard",
                type: "string",
                required: false,
                default: "{position}. {invitername} - {total} invites",
            },
        ],
        options: [
            "{position}",
            "{invitername}",
            "{inviter}",
            "{inviternick}",
            "{total}",
            "{fake}",
            "{real}",
            "{leave}",
        ],
        returns: "string",
        example: `
$inviteLeaderboard
//or

$inviteLeaderboard[$guildID;1;10;{position}. {invitername} - {total} invites]
        `,
        code: async (d: any) => {
            const data = d.util.aoiFunc(d);

            const [
                guildId = d.guild?.id,
                page = 1,
                limit = 10,
                format = "{position}. {invitername} - {total} invites",
            ] = data.inside.splits;

            const inviteSystem = d.client.AoiInviteSystem;
            if (!inviteSystem)
                return d.aoiError.fnError(
                    d,
                    "custom",
                    { inside: data.inside },
                    "InviteManager is not enabled in this bot!",
                );

            data.result = await inviteSystem.getInviteLeaderboard(
                guildId,
                page,
                limit,
                format,
            );

            return {
                code: d.util.setCode(data),
            };
        },
    },
];

export default funcitons;
