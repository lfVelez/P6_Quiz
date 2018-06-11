const Sequelize = require("sequelize");
const {models} = require("../models");


// Autoload the tip with id equals to :tipId
exports.load = (req, res, next, tipId) => {

    models.tip.findById(tipId)
    .then(tip => {
        if (tip) {
            req.tip = tip;
            next();
        } else {
            next(new Error('There is no tip with tipId=' + tipId));
        }
    })
    .catch(error => next(error));
};


// POST /quizzes/:quizId/tips
exports.create = (req, res, next) => {
    const authorId = req.session.user && req.session.user.id || 0; // Saco el id del autor
 
    const tip = models.tip.build(
        {
            text: req.body.text,
            quizId: req.quiz.id,
            authorId // Added
        });

    tip.save({fields:["text","quizId","authorId"]})
    .then(tip => {
        req.flash('success', 'Tip created successfully.');
        res.redirect("back");
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.redirect("back");
    })
    .catch(error => {
        req.flash('error', 'Error creating the new tip: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/tips/:tipId/accept
exports.accept = (req, res, next) => {

    const {tip} = req;

    tip.accepted = true;

    tip.save(["accepted"])
    .then(tip => {
        req.flash('success', 'Tip accepted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => {
        req.flash('error', 'Error accepting the tip: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = (req, res, next) => {

    req.tip.destroy()
    .then(() => {
        req.flash('success', 'tip deleted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => next(error));
};

exports.new = (req,res,next) => {
    const tip = {
        text:""
    };
    const {quiz}=req;
    res.render('tips/new',{tip,quiz});
};
/*
Compruebo que se ha logueado como Admin o como el autor del tip
Si lo es => Paso al siguiente MW
En caso contrario => Prohibido(403)
 */
exports.adminOrAuthorRequired=(req,res,next) => {
  const imAdmin = !!req.session.user.isAdmin;
  const imAuthor = req.session.user.id === req.tip.authorId;
  if (imAdmin||imAuthor){
      next();
  }else {
      res.send(403);
  }

};

/*
MW que edita
 */
exports.edit = (req,res,next)=>{
    const {quiz,tip} = req;
    res.render('tips/edit',{quiz,tip});
};

/*
MW que actualiza
 */

exports.update = (req,res,next) => {
  const {quiz,id} = req;
  tip.text = req.body.text; //El texto se encuentra en el BODY => se ha usado POST
    tip.accepted = false; // Si se ha editado, tiene que aceptarse todavia

    tip.save({fields:["text","accepted"]})
        .then(tip => {
            req.flash('success','Tip edited successfully');
            res.redirect('/quizzes'+req.params.quizId);
        })
        .catch(Sequelize.ValidationError,error => {
            req.flash('error','There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error',message));
            res.render('tips/edit',{quiz,tip});
        })
        .catch(error => {
            req.flash('error','Error editing the Quiz' + error.message);
            next(error);
        });
};

