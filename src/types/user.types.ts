export interface IUser {
    _id: string,
    name: string,
    email: string,
    password: string,
    mobile: string,
    createAt?: Date,
    updateAt?: Date
}

export interface RegisterBody {
    name: string,
    email: string,
    password: string,
    mobile: string
}

export interface LoginBody {
    email: string,
    password: string,
}

export interface JWTPayload {
    userId: string,
    email?: string
}