import { keyof } from "zod"
import { client } from "../../database/repo/redis.connection.js"


export const set= async({key , value ,ttl})=>{
    if(typeof value != "string"){
        value = JSON.stringify(value)
    }
    return await client.set(key , value , {EX: ttl})
}


export const get = async({key})=>{
    let data = await client.get(key)

    if (!data) return null
    try{
        return JSON.parse(await client.get(key))
    }catch{
        return await client.get(key)
    }
}

export const incrBy = async({key , incr=1})=>{
    return await client.incrBy(key ,incr)
}

export const ttl = async ({key})=>{
    return await client.ttl(key)
}


export const expire = async ({key , ttl})=>{
    return await client.exists(key , ttl)
}


export const exists =async ({key , ttl})=>{
    return await client.exists(key)
}


export const del = async({keys})=>{
    return await client.del(keys)
}


export const keys = async({prefix})=>{
    return await client.keys(`${prefix}*`)
}


export const delByPrefix = async({prefix})=>{
    let data = await keys({prefix})
    if(data.length == 0) return 0
    return await client.del(data)
}