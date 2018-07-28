var express= require('express')
var middleware= require('./middlewares')
var path= require('path')

var app= express()


//app.set('views','./views');

app.use(middleware)


app.use(express.static(path.join(__dirname,'public')))



app.get('/',function(req,res){
    res.status(200).sendFile(__dirname+'/public/index.html')
})

app.get('/error',function(req,res){
    res.json({error: 'page not found', validUrl : 'http://localhost:3000'})
})


var server= app.listen( process.env.PORT || '3000',function(){
    console.log('app listening on port %s...',server.address().port)
})