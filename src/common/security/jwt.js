
import jwt from "jsonwebtoken"
import configService from "../../config/config.service.js"
import { tokenTypeEnum } from "../enums/tokenType.enum.js"
import { RoleEnum } from "../enums/role.enum.js"
import { UnauthorizedException } from "../utils/exceptions.js"
import { webcrypto } from "node:crypto"
import { userRevokeKey } from "../service/cacheKeys.service.js"
import { get } from "../service/cache.service.js"
import  ur  from "../../database/repo/user.repo.js"

export const createTokens = ({ payload = {}, options = {}, role = RoleEnum.user }) => {
    let secrets = getRoleSecret(role)
    let jti = webcrypto.randomUUID()

    let accessToken = createToken({
        payload: {
            ...payload,
            jti
        },
        options: {
            ...options,
            expiresIn: configService.JWT_ACCESS_EXP,
            audience: [role]
        },
        secret: secrets.access,
    })

    let refreshToken = createToken({
        payload: {
            ...payload,
            jti
        },
        options: {
            ...options,
            expiresIn: configService.JWT_REFRESH_EXP,
            audience: [role]
        },
        secret: secrets.refresh,
    })

    return { accessToken, refreshToken }
}

const getSecret = ({ tokenType = tokenTypeEnum.ACCESS, role = RoleEnum.user }) => {
    const secrets = getRoleSecret(role)
    return tokenType == tokenTypeEnum.REFRESH ? secrets.refresh : secrets.access
}

const getRoleSecret = (role) => {
    switch (role) {
        case RoleEnum.admin:
            return {
                access: configService.JWT_ACCESS_ADMIN_SECRET,
                refresh: configService.JWT_REFRESH_ADMIN_SECRET,
            }
        default:
            return {
                access: configService.JWT_ACCESS_USER_SECRET,
                refresh: configService.JWT_REFRESH_USER_SECRET,
            }
    }
}

export const createToken = ({ payload = {}, options = {}, secret = configService.JWT_ACCESS_SECRET }) => {
    return jwt.sign(payload, secret, options)
}

export const verifyToken = async ({ token, tokenType = tokenTypeEnum.ACCESS }) => {

    let { aud, sub, jti, iat } = jwt.decode(token)

    let isRevoked = await get({
        key: userRevokeKey({ userId: sub, jti })
    })
    if (isRevoked) UnauthorizedException("This token is revoked")

        let user = await ur.findById({id:sub , projection:{changeCredenitalsAt:1}})
        
        if (user.changeCredenitalsAt &&
            Math.ceil(user.changeCredenitalsAt.getTime() / 1000) > iat) {
            UnauthorizedException("This token is revoked")
        }
    return jwt.verify(token, getSecret({ tokenType, role: aud[0] }))
}
