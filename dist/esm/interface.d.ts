export interface CodeData {
    id: string;
    join: number;
    isFake: boolean;
}
export interface InviterData {
    inviter: string;
    codes: string[];
    codeData: {
        [key: string]: {
            fake: number;
            total: number;
            real: number;
            leave: number;
        };
    };
    counts: {
        fake: number;
        total: number;
        real: number;
        leave: number;
    };
}
export interface InviteSystemEvents {
    inviteJoin: ({ inviter, memberId, code, guildId, }: {
        inviter: string;
        memberId: string;
        code: string;
        guildId: string;
    }) => void;
    inviteLeave: ({ inviter, memberId, code, guildId, }: {
        inviter: string;
        memberId: string;
        code: string;
        guildId: string;
    }) => void;
    error: (error: Error) => void;
}
export interface FunctionData {
    name: string;
    description: string;
    type?: "djs";
    fields: {
        name: string;
        description: string;
        type: string;
        required: boolean;
        default?: string;
    }[];
    options: string[];
    returns: string;
    example: string;
    code: (d: any) => Promise<{
        code: string;
    }>;
}
//# sourceMappingURL=interface.d.ts.map