export const userKeyBase = ({userId})=>{
    return `user::${userId}`
}


export const userRevokeKey = ({userId , jti})=>{
    return `${userKeyBase({userId})}::revoke::${jti}`
}


export const userOtpKey = ({userId})=>{
    return `${userKeyBase({userId})}::otp`
}


export const userSubjectedOtpKey = ({userId , subject})=>{
    return `${userOtpKey({userId})}::${subject}`
}


export const userOtpTrailsKey = ({userId , subject})=>{
    return `${userSubjectedOtpKey({userId , subject})}::trails`
}


export const userWrongOtpTrailsKey = ({userId , subject})=>{
    return `${userOtpTrailsKey ({userId , subject})}::wrong`
}


export const userBlockKey = ({userId , subject})=>{
    return `${userSubjectedOtpKey({userId , subject})}::block`
}