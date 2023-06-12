import type { Tiktoken } from "@dqbd/tiktoken";
import { DataBase, type character } from "./storage/database";
import { get } from "svelte/store";
import { tokenizeTransformers } from "./transformers/transformer";
import type { OpenAIChat } from "./process";

async function encode(data:string):Promise<(number[]|Uint32Array)>{
    let db = get(DataBase)
    if(db.aiModel === 'novellist'){
        return await tokenizeTransformers('naclbit/trin_tokenizer_v3',data)
    }
    return await tikJS(data)
}

let tikParser:Tiktoken = null

async function tikJS(text:string) {
    if(!tikParser){
        const {Tiktoken} = await import('@dqbd/tiktoken')
        const cl100k_base = await import("@dqbd/tiktoken/encoders/cl100k_base.json");
    
        tikParser = new Tiktoken(
            cl100k_base.bpe_ranks,
            cl100k_base.special_tokens,
            cl100k_base.pat_str
        );
    }
    return tikParser.encode(text)
}

export async function tokenizerChar(char:character) {
    const encoded = await encode(char.name + '\n' + char.firstMessage + '\n' + char.desc)
    return encoded.length
}

export async function tokenize(data:string) {
    const encoded = await encode(data)
    return encoded.length
}


export class ChatTokenizer {

    private chatAdditonalTokens:number
    private useName:'name'|'noName'

    constructor(chatAdditonalTokens:number, useName:'name'|'noName'){
        this.chatAdditonalTokens = chatAdditonalTokens
        this.useName = useName
    }
    async tokenizeChat(data:OpenAIChat) {
        let encoded = (await encode(data.content)).length + this.chatAdditonalTokens
        if(data.name && this.useName ==='name'){
            encoded += (await encode(data.name)).length
        }
        return encoded
    }

    
}

export async function tokenizeNum(data:string) {
    const encoded = await encode(data)
    return encoded
}
