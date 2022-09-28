const express = require('express');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken')
const User = require('../models/user');

const authConfig = require('../config/auth.json')

const router = express.Router();


//Rota de Registro


router.post('/register', async(req, res) =>{
    try{

        const {email} = req.body;


        //Compara o email com o banco de dados, caso haja um email igual no banco impede o cadastro
        if (await User.findOne({email}))
            return res.status(400).send({error: 'User already exists'})


        const user = await User.create(req.body);

        user.password = undefined; //Evita que o backend retorne o password

        return res.send({user});
    }catch(err){
        return res.status(400).send({error : 'Registration failed'});
    }
});


//Rota de Autenticação


router.post('/authenticate', async (req, res) =>{
    const {email, password} = req.body;

    //Como foi passado no userjs para nao passar o password para o cliente é necessario dar um select no password para poder fazer a vallidação da senha junto do email
    const user = await User.findOne({email}).select('+password');


    //Compara se o usuario que o cliente digitou existe no banco de dados
    if (!user)
        return res.status(400).send({error: 'User Not found'});


    //Como o password foi criptografado e necessario que o bcrypt verifique o hash da senha
    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({error: 'Invalid Passwords'});

    user.password = undefined; //Evita que o backend retorne o password

    const token = jwt.sign({id: user.id},authConfig.secret,{
        expiresIn: 86400,
    } );

    res.send({user, token}); // retorna o usuario

})

module.exports = app => app.use('/auth', router);