var mongodb = require('./db'),
    ObjectID = require('mongodb').ObjectID,
    markdown = require('markdown').markdown;

function Post(author,title,content) {
    this.title = title;
    this.content = content;
    this.author = author;
}


module.exports = Post;

Post.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
      date : date,
      year : date.getFullYear(),
      month : date.getFullYear() + '-' +(date.getMonth()+1),
      day : date.getFullYear() + '-' +(date.getMonth()+1) + '-' + date.getDay(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
          date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    //要存入数据库的文档
    var post = {
        title : this.title,
        content : this.content,
        author : this.author,
        time : time,
        pv : 0
    };
    //打开数据库
    mongodb.open(function(err,db){
        if(err) {
            return callback(err);
        }
        //读取 posts 集合
       	db.collection('posts',function(err,data){
            if(err){
            	mongodb.close();
                return callback(err);
            }
            data.insert(post,{safe:true},function(err){
                mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
            });
        });
    });


};



//读取文章
Post.get = function(name,page,callback) {

    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,data){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //var query = name?{query:name}:{};
            var query = {};
            data.count(query,function(err,total) {
                data.find(query,{
                    skip : (page-1)*10,
                    limit : 10
                }).sort({time:-1}).toArray(function(err,docs){
                    mongodb.close();
                    if(err){
                        return callback(err);//读取失败返回err
                    }
                    docs.forEach(function(doc){
                        doc.content = markdown.toHTML(doc.content);
                    });
                    callback(null,docs,total);//成功！以数组形式返回结果

                });
            });


        });
    });

};


//读取文章详细信息
Post.getDetail = function(id,callback) {
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,data){
            if(err) {
                mongodb.close();
                return callback(err);
            }
            var _id = {'_id':new ObjectID(id)};
            data.findOne(_id,function(err,doc) {

                if(err){
                    mongodb.close();
                    return callback(err);
                }

                if(doc) {
                    //解析 markdown 为 html
                    doc.content = markdown.toHTML(doc.content);
                    callback(null,doc);

                    data.update(_id,{ $inc:{'pv':1} },function(err){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                    });

                }

            });
        });

    });
};

//删除文章
Post.remove = function(id,callback) {
    mongodb.open(function(err,db){
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,data){
            if(err) {
                mongodb.close();
                return callback(err);
            }
            data.remove({'_id':new ObjectID(id)},{w:1},function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });


    });
};

//编辑文章
Post.edit = function(id,callback) {

    mongodb.open(function(err,db){
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,data){
            if(err) {
                mongodb.close();
                return callback(err);
            }
            data.findOne({'_id':new ObjectID(id)},function(err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                if(doc) {
                    callback(null,doc);
                }

            });
        });

    });
};

//更新文章
Post.update = function(id,content,callback) {

    mongodb.open(function(err,db){
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,data){
            if(err) {
                mongodb.close();
                return callback(err);
            }
            data.update({'_id':new ObjectID(id)},{$set: {content: content}},function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//文章存档
Post.archive = function(page,callback){

    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,data){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //var query = name?{query:name}:{};
            var query = {};
            data.count(query,{
                'name' : 1,
                'title' : 1,
                'time' : 1
            },function(err,total) {
                data.find(query,{
                    skip : (page-1)*10,
                    limit : 10
                }).sort({time:-1}).toArray(function(err,docs){
                    mongodb.close();
                    if(err){
                        return callback(err);//读取失败返回err
                    }
                    docs.forEach(function(doc){
                        doc.content = markdown.toHTML(doc.content);
                    });
                    callback(null,docs,total);//成功！以数组形式返回结果

                });
            });


        });
    });
};