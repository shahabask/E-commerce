const is_loggedIn=(req,res,next)=>{
    try{
         if(req.session.user_id){}
         else{
            res.redirect('/login')
         }
         next()
    }catch(error){
        console.log(error.message)
    }
   
}

const is_loggedOut=(req,res,next)=>{
    try{
         if(req.session.user_id){
           res.redirect('/')
         }else
         {
         next()
        }
    }catch(error){
        console.log(error.message)
    }
    
}








module.exports={
   is_loggedIn,
   is_loggedOut
}