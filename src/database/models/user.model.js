import mongoose from"mongoose"
import {GenderEnum} from "../../common/enums/gender.enum.js"
import {RoleEnum} from "../../common/enums/role.enum.js"
import { ProviderEnum } from "../../common/enums/provider.enum.js"


const userSchema = new mongoose.Schema({
    firstName:{
        type :String,
        maxLenght : 50,
        minLLenght : 2,
        required :true
    },
    lastName:{
        type :String,
        maxLenght : 50,
        minLLenght : 2,
        required :true
    },
    email :{
        type :String,
        maxLenght : 100,
        minLLenght : 5,
        required :true,
        unique : true
    },
    gender : {
        type : Number,
        enum : Object.values(GenderEnum),
        default : GenderEnum.male
    },
    password :{
        type : String,
        required : function(value){
            return value?.provider == ProviderEnum.system
        },
    },
    phone:{
        type : String,
    },
    role:{
        type : Number,
        enum : Object.values(RoleEnum),
        default : RoleEnum.user
    },
    provide : {
        type : Number,
        enum : Object.values(ProviderEnum),
        default : ProviderEnum.system
    },
    image :String,
    confirmEmail : Date,
    changeCredenitalsAt : Date
},{
    timestamps :true,
    strict : true,
    strictQuery : true,
    toJson : {
        virtuals : true
    },
    toObject:{
        virtuals : true
    },
    autoIndex : true
})

userSchema.virtual("userName").set(function(value){
    let [firstName, lastName] =value.split(" ")
    this.firstName = firstName
    this.lastName = lastName
}).get(function(){
    return `${this.firstName} ${this.lastName}`
})

export const userModel = mongoose.model("User", userSchema)