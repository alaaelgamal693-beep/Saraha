
import {langEnum} from "../enums/lang.enum.js"

export default (code, lang) => {
    let langString = Number(lang) === langEnum.ar ? "ar" : "en";
    return messages[code][langString];
}

let messages = {
    shortPassword: {
        ar: "كلمة السر قصيرة جداً",
        en: "password is too short"
    },
    invalidEmail: {
        ar: "ايميل غير صالح",
        en: "Invalid Email"
    }
}

export const keys = Object.keys(messages);