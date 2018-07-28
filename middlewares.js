
module.exports= function(req,res,next){

    if(req.path !== '/' && req.path !== '/main.css' && req.path !== '/img/fastlogo.png' && req.path !== '/img/Octocat.png' 
            && req.path !== '/img/vue.png' && req.path !== 'error'){
        req.url= '/error'
    }
    
    next() 
}