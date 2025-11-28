const fs = require('fs')

//// Owner Setting ~~~~~~~~
global.owner = "201091402085"
global.ownernamel = "𝐁𝐘:〔𝟕𝑨𝑴𝑳𝑨 𝑬𝑿𝑶𝑫𝑰𝑨〕"
global.botoname = "𝐓𝟎𝐌 𝐁𝐎𝐓"
global.footer = "𝐓𝟎𝐌 𝐁𝐎𝐓𝑽🔥"
global.packname = "تومي"

//// System Setting ~~~~~~~~
global.version = "1.0.0"
global.idci = "120363421605607612@newsletter"
global.prefa = ["", "/", ""]

//// Thumbnail Setting ~~~~~~~~
global.thumb = "https://files.catbox.moe/z37x19.jpg"

//// Message Setting ~~~~~~~~
global.mess = {
owner: "-[* ACCESS DENIED*]-\n*You Cannot Use This Feature Because You Are Not the Owner!*",
ownerprem: "-[* ACCESS DENIED*]-\n*You Cannot Use This Feature Because You Are Not a Premium Owner  & User!*"
}

//// Let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
   require('fs').unwatchFile(file)
   console.log('ʌʸʇ3m-32m __filename updated!')
   delete require.cache[file]
   require(file)
})