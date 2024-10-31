const express = require('express')
const authRouter = express.Router()
const authController =require('../controllers/auth-controllers')
const {registerValidator, loginValidator} = require('../middlewares/validators')
const authenticate = require('../middlewares/authenticate')
authRouter.post('/register',registerValidator,authController.register)
authRouter.post('/login',loginValidator,authController.login)
authRouter.post('/register-google',authController.loginGoogle)
authRouter.get('/getme',authenticate.auth,authController.getMe)
authRouter.post('/forgotPassword',authController.forgetPassword)
authRouter.put('/resetPassword/',authController.resetPassword)
module.exports = authRouter