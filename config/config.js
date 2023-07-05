const myEnv=require('dotenv').config()
const ADMIN_EMAIL =process.env.EMAIL
const APP_PASSWORD = process.env.APP_PASSWORD
const RAZORPAY_KEY_ID = process.env.KEY_ID 
const RAZORPAY_KEY_SECRET = process.env.KEY_SECRET 
const SESSIONSECRET =process.env.SESSIONSECRET
const SMTPKEY=process.env.SMTPKEY
const  SMTPOWNER=process.env.SMTPOWNER

module.exports={
    SESSIONSECRET,
    SMTPKEY,
    SMTPOWNER,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    APP_PASSWORD,
    ADMIN_EMAIL,
    
}