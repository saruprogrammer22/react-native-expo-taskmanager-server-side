export type IUser = {
    userId?: number;
    name: string;
    email: string;
    password: string;
}

export type IUserUpdate = {
    name: string;
    email: string;
}

export type ILogin = {
    email: string;
    password: string;
}

export type ITask = {
    title: string;
    category: string;
    status: string;
}
