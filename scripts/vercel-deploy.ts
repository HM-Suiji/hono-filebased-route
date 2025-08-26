import { writeFile } from 'fs'

writeFile('.vercel/version.txt', crypto.randomUUID(), err => console.log('Error: ', err))
