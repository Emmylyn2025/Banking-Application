
export interface userRemoval extends userBody, userToken {
  createdAt: Date,
  emailVerified: boolean
}

export interface loginBody {
  email: string
  password: string
}

export type userResultPasswordRemoval = Omit<userRemoval, "createdAt" | "id" | "role">;

export type emailVerificationQueueData = Pick<loginBody, "email"> & { url: string };

export type passwordResetQueueData = Pick<loginBody, "email"> & { url: string, ip: string, userAgent: string };

export interface userBody extends loginBody {
  name: string
}

export interface userUpdateParams {
  userId: string
}

export interface userDeleteParams extends userUpdateParams{
  
}

export interface userUpdateBody {
  role?: "user" | "admin",
  Balance?: number,
  accountId?: string
}

export interface userToken {
  id: string,
  role: "user" | "admin"
}

export interface tokens {
  accessToken: string
  refreshToken: string
}

export interface apiResponse<T> {
  success: boolean
  message: string
  data?: T
}

//For req.user
declare global {
  namespace Express {
    interface Request {
      user?: userToken;
    }
  }
}

export interface userTranferTypes {
  acctNumber: number,
  password: string,
  amount: number
}