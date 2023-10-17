//@ts-nocheck
import Flagsmith from "flagsmith-nodejs/build/sdk"

let flagsmith;
if(process.env.FLAGSMITH_ENVIRONMENT_KEY)
flagsmith = new Flagsmith({
    environmentKey: process.env.FLAGSMITH_ENVIRONMENT_KEY
})

export { flagsmith }