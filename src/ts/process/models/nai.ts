import { DataBase, setDatabase } from "src/ts/storage/database"
import type { OpenAIChat } from ".."
import { get } from "svelte/store"
import { globalFetch } from "src/ts/storage/globalApi"
import { alertError, alertInput, alertNormal, alertWait } from "src/ts/alert"
import { sleep } from "src/ts/util"

export function stringlizeNAIChat(formated:OpenAIChat[], char:string, continued: boolean){

    
    const db = get(DataBase)
    let seperator = db.NAIsettings.seperator.replaceAll("\\n","\n") || '\n'
    let starter = db.NAIsettings.starter.replaceAll("\\n","\n") || '***\n[conversation: start]'
    let resultString:string[] = []

    console.log(formated)

    for(const form of formated){
        if(form.role === 'system'){
            if(form.memo === 'NewChatExample' || form.memo === 'NewChat' || form.content === "[Start a new chat]"){
                resultString.push(starter)
            }
            else{
                resultString.push(form.content)
            }
        }
        else if(form.name || form.role === 'assistant'){
            resultString.push((form.name ?? char) + ": " + form.content)
        }
        else if(form.role === 'user'){
            resultString.push(db.username + ": " + form.content)
        }
        else{
            resultString.push(form.content)
        }
    }

    let res = resultString.join(seperator)

    if(!continued){
        res += `\n\n${char}:`
    }
    return res
}

export const novelLogin = async () => {
    try {
        const username = await alertInput("NovelAI Email")

        const password = await alertInput("NovelAI Password")


        alertWait('Logging in to NovelAI')

        let tries = 0
        let error = ''
        while (tries < 3) {
            try {

                const _sodium = await import('libsodium-wrappers-sumo')
                await sleep(1000)
                await _sodium.ready
                const sodium = _sodium;

                // I don't know why, but this is needed to make it work
                console.log(sodium)
                await sleep(1000)

                const key = sodium
                .crypto_pwhash(
                    64,
                    new Uint8Array(Buffer.from(password)),
                    sodium.crypto_generichash(
                    sodium.crypto_pwhash_SALTBYTES,
                    password.slice(0, 6) + username + 'novelai_data_access_key'
                    ),
                    2,
                    2e6,
                    sodium.crypto_pwhash_ALG_ARGON2ID13,
                    'base64'
                )
                .slice(0, 64)
            
                const r = await globalFetch('https://api.novelai.net/user/login', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body:{
                        key: key
                    }
                })
            
                if ((!r.ok) || (!r.data?.accessToken)) {
                    alertError(`Failed to authenticate with NovelAI: ${r.data?.message ?? r.data}`)
                    return
                }

                const data = r.data?.accessToken

                const db = get(DataBase)
                db.novelai.token = data

                alertNormal('Logged in to NovelAI')
                setDatabase(db)
                return
            }
            catch (error) {
                error = (`Failed to authenticate with NovelAI: ${error}`)
                tries++
            }
        }
        alertError(error)
    } catch (error) {
        alertError(`Failed to authenticate with NovelAI: ${error}`)
    }
}

export interface NAISettings{
    topK: number
    topP: number
    topA: number
    tailFreeSampling: number
    repetitionPenalty: number
    repetitionPenaltyRange: number
    repetitionPenaltySlope: number
    repostitionPenaltyPresence: number
    seperator: string
    frequencyPenalty: number
    presencePenalty: number
    typicalp:number
    starter:string
}

export const NovelAIBadWordIds = [
    [60],
    [62],
    [544],
    [683],
    [696],
    [880],
    [905],
    [1008],
    [1019],
    [1084],
    [1092],
    [1181],
    [1184],
    [1254],
    [1447],
    [1570],
    [1656],
    [2194],
    [2470],
    [2479],
    [2498],
    [2947],
    [3138],
    [3291],
    [3455],
    [3725],
    [3851],
    [3891],
    [3921],
    [3951],
    [4207],
    [4299],
    [4622],
    [4681],
    [5013],
    [5032],
    [5180],
    [5218],
    [5290],
    [5413],
    [5456],
    [5709],
    [5749],
    [5774],
    [6038],
    [6257],
    [6334],
    [6660],
    [6904],
    [7082],
    [7086],
    [7254],
    [7444],
    [7748],
    [8001],
    [8088],
    [8168],
    [8562],
    [8605],
    [8795],
    [8850],
    [9014],
    [9102],
    [9259],
    [9318],
    [9336],
    [9502],
    [9686],
    [9793],
    [9855],
    [9899],
    [9955],
    [10148],
    [10174],
    [10943],
    [11326],
    [11337],
    [11661],
    [12004],
    [12084],
    [12159],
    [12520],
    [12977],
    [13380],
    [13488],
    [13663],
    [13811],
    [13976],
    [14412],
    [14598],
    [14767],
    [15640],
    [15707],
    [15775],
    [15830],
    [16079],
    [16354],
    [16369],
    [16445],
    [16595],
    [16614],
    [16731],
    [16943],
    [17278],
    [17281],
    [17548],
    [17555],
    [17981],
    [18022],
    [18095],
    [18297],
    [18413],
    [18736],
    [18772],
    [18990],
    [19181],
    [20095],
    [20197],
    [20481],
    [20629],
    [20871],
    [20879],
    [20924],
    [20977],
    [21375],
    [21382],
    [21391],
    [21687],
    [21810],
    [21828],
    [21938],
    [22367],
    [22372],
    [22734],
    [23405],
    [23505],
    [23734],
    [23741],
    [23781],
    [24237],
    [24254],
    [24345],
    [24430],
    [25416],
    [25896],
    [26119],
    [26635],
    [26842],
    [26991],
    [26997],
    [27075],
    [27114],
    [27468],
    [27501],
    [27618],
    [27655],
    [27720],
    [27829],
    [28052],
    [28118],
    [28231],
    [28532],
    [28571],
    [28591],
    [28653],
    [29013],
    [29547],
    [29650],
    [29925],
    [30522],
    [30537],
    [30996],
    [31011],
    [31053],
    [31096],
    [31148],
    [31258],
    [31350],
    [31379],
    [31422],
    [31789],
    [31830],
    [32214],
    [32666],
    [32871],
    [33094],
    [33376],
    [33440],
    [33805],
    [34368],
    [34398],
    [34417],
    [34418],
    [34419],
    [34476],
    [34494],
    [34607],
    [34758],
    [34761],
    [34904],
    [34993],
    [35117],
    [35138],
    [35237],
    [35487],
    [35830],
    [35869],
    [36033],
    [36134],
    [36320],
    [36399],
    [36487],
    [36586],
    [36676],
    [36692],
    [36786],
    [37077],
    [37594],
    [37596],
    [37786],
    [37982],
    [38475],
    [38791],
    [39083],
    [39258],
    [39487],
    [39822],
    [40116],
    [40125],
    [41000],
    [41018],
    [41256],
    [41305],
    [41361],
    [41447],
    [41449],
    [41512],
    [41604],
    [42041],
    [42274],
    [42368],
    [42696],
    [42767],
    [42804],
    [42854],
    [42944],
    [42989],
    [43134],
    [43144],
    [43189],
    [43521],
    [43782],
    [44082],
    [44162],
    [44270],
    [44308],
    [44479],
    [44524],
    [44965],
    [45114],
    [45301],
    [45382],
    [45443],
    [45472],
    [45488],
    [45507],
    [45564],
    [45662],
    [46265],
    [46267],
    [46275],
    [46295],
    [46462],
    [46468],
    [46576],
    [46694],
    [47093],
    [47384],
    [47389],
    [47446],
    [47552],
    [47686],
    [47744],
    [47916],
    [48064],
    [48167],
    [48392],
    [48471],
    [48664],
    [48701],
    [49021],
    [49193],
    [49236],
    [49550],
    [49694],
    [49806],
    [49824],
    [50001],
    [50256],
    [0],
    [1],
    [3],
    [49356],
    [1431],
    [31715],
    [34387],
    [20765],
    [30702],
    [10691],
    [49333],
    [1266],
    [19438],
    [43145],
    [26523],
    [41471],
    [2936],
    [23]
]