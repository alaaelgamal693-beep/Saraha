import jwt from "jsonwebtoken"
import configService from "../../config/config.service.js"
import { tokenTypeEnum } from "../enums/tokenType.enum.js"
import { RoleEnum } from "../enums/role.enum.js"
import { UnauthorizedException } from "../utils/exceptions.js"

export const createTokens = ({ payload = {}, options = {}, role = RoleEnum.user }) => {
    const secrets = getRoleSecret(role)

    const accessToken = createToken({
        payload,
        options: {
            ...options,
            expiresIn: configService.JWT_ACCESS_EXP,
            audience: [role],
        },
        secret: secrets.access,
    })

    const refreshToken = createToken({
        payload,
        options: {
            ...options,
            expiresIn: configService.JWT_REFRESH_EXP,
            audience: [role],
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

export const verifyToken = ({ token, tokenType = tokenTypeEnum.ACCESS }) => {
    const decoded = jwt.decode(token)
    if (!decoded) {
        throw UnauthorizedException("invalid token")
    }

    const role = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud

    try {
        return jwt.verify(token, getSecret({ tokenType, role }))
    } catch (err) {
        throw UnauthorizedException(err.message)
    }
}