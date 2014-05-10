
var crypto = require('crypto'),
    User = require('../models/user.js'),
    Article = require('../models/article.js'),
    fs = require('fs');



module.exports = function(app) {

  app.get('/', function(req, res) {

    var page = req.query.page ? parseInt(req.query.page) : 1;

    Article.get(null,page,function(err,posts,total){

        if(err){
            posts = [];
        }
        res.render('index', {
            title: '首页',
            user: req.session.user,
            page : page,
            isFirstPage : (page -1) === 0,
            isLastPage : ((page-1)*10 + posts.length) === total,
            posts :posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

  });  //首页

  app.get('/login',isLogin);    //登录页
  app.get('/login', function(req, res) {
    res.render('login', { 
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
     });
  });
  
  app.get('/logout',notLogin);  //退出登录
  app.get('/logout',function(req,res) {
    req.session.user = null;
    req.flash('success', '退出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });


  app.get('/reg',isLogin);  //注册页
  app.get('/reg', function(req, res) {
    res.render('reg', { 
      title: '首页',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
     });
  });

  app.get('/post',notLogin);    //发布文章页
  app.get('/post', function(req, res) {
      res.render('post', { 
      title: '首页',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
     });
  });

  //文章详细
  app.get('/article/:id', function(req, res){
      Article.getDetail(req.params.id,function(err,post){
            if(err) {
                req.flash('err',err);
                res.redirect('/');
            }
            res.render('article',{
                title: '详细页',
                post : post,
                user:req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
      });
  });

  //删除文章

  app.get('/remove/:id',function(req,res){
      var _id = req.params.id;
      Article.remove(_id,function(err){
          if(err) {
              req.flash('error',err);
              return res.redirect('/');
          }
          req.flash('success','删除成功！');
          res.redirect('/');
      });
  });

  //编辑页面
  app.get('/edit/:id',function(req,res){

      Article.edit(req.params.id,function(err,post){
          if(err) {
              req.flash('err',err);
              res.redirect('/');
          }
          res.render('edit',{
              title: '编辑文章',
              post : post,
              user:req.session.user,
              success: req.flash('success').toString(),
              error: req.flash('error').toString()
          });
      });
  });
  //存档页面
  app.get('/archive',function(req,res){
      var page = req.query.page ? parseInt(req.query.page) : 1;

      Article.get(null,page,function(err,posts,total){
          if(err){
              posts = [];
          }
          res.render('archive', {
              title: '存档',
              user: req.session.user,
              page : page,
              isFirstPage : (page -1) === 0,
              isLastPage : ((page-1)*10 + posts.length) === total,
              posts :posts,
              success: req.flash('success').toString(),
              error: req.flash('error').toString()
          });
      });
  });







    //注册post
  app.post('/reg', function (req, res) {

      var name = req.body.name,
          password = req.body.password;

          if(name === '' && password === '') {
             req.flash('error', '用户名密码不能为空!');
             res.redirect('/reg');//注册成功后返回主页
             return;
          }
         
          

      //生成密码的 md5 值
      var md5 = crypto.createHash('md5'),
          password = md5.update(req.body.password).digest('hex');
          
      var newUser = new User({
          name: name,
          password: password
      });

      //检查用户名是否已经存在 
      User.get(newUser.name, function (err, user) {
        if (user) {
          req.flash('error', '用户已存在!');
          return res.redirect('/reg');//返回注册页
        }
        //如果不存在则新增用户
        newUser.save(function (err, user) {
          if (err) {
            req.flash('error', err);
            return res.redirect('/reg');//注册失败返回注册
          }
          req.session.user = user;//用户信息存入 session
          req.flash('success', '注册成功!');
          res.redirect('/');//注册成功后返回主页
        });

      });

  });

   //登录post
  app.post('/login',function(req,res) {

      var name = req.body.name,
          password = req.body.password;

      //生成密码的 md5 值
      var md5 = crypto.createHash('md5'),
          password = md5.update(req.body.password).digest('hex');

      var newUser = new User({
          name: name,
            password: password
      });


      //检查用户名是否已经存在 
      User.get(newUser.name, function (err, user) {

        if (!user) {
          req.flash('error', '用户不存在!');
          return res.redirect('/login');//返回注册页
        }

        req.session.user = user;
        req.flash('success','登录成功！');
        res.redirect('/');


      });      


  });

  //发布文章
  app.post('/post',notLogin);
  app.post('/post',function(req,res) {

    var cuerrentUser = req.session.user,
      article = new Article(cuerrentUser.name,req.body.title,req.body.content);
      saveImg(req,res);//保存图片
      article.save(function(err){
        if(err){
            req.flash('error',err);
            return res.redirect('/');
        }
        req.flash('success','发布成功！');
        res.redirect('/');
      });

  });

  //修改文章
  app.post('/update/:id',notLogin);
  app.post('/update/:id',function(req,res){
      var _id = req.params.id;
      saveImg(req,res);//保存图片
      console.log(_id);
      Article.update(_id,req.body.content,function(err){
          if(err){
              req.flash('error',err);
              return res.redirect('/');
          }
          req.flash('success','修改成功！');
          res.redirect('/');
      });
  });


    app.use(function (req, res) {

        res.render('404', {
            title: '404,页面弄丢了',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });


};



function isLogin(req,res,next) {
    if(req.session.user){
        req.flash('error', '已经登录！');
        res.redirect('back');//返回注册页
    }
    next();
}

function notLogin(req,res,next) {
    if(!req.session.user){
        req.flash('error', '未登录！');
        res.redirect('/login');//返回登录
    }
    next();
}

//同步操作保存图片
function saveImg (req,res) {
    var files = req.files;
    for(i in files) {
        if(files[i].size === 0 ){
            fs.unlinkSync(files[i].path);
            console.log('删除空文件成功！');
        }else{
            var path = './public/images/'+ files[i].name;
            fs.renameSync(files[i].path,path);
            console.log('重命名文件成功！');
        }
    }
//    req.flash('success','文件上传成功');
//    res.redirect('/');

}















