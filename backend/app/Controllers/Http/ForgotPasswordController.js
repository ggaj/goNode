'use strict'

const crypto = require('crypto')
const User = use('App/Models/User')
const Mail = use('Mail')
const { subDays, isAfter } = require('date-fns')

class ForgotPasswordController {
  async store({ request, response }){
    try {
      const email = request.input('email')

      const user = await User.findByOrFail('email', email)

      user.token = crypto.randomBytes(10).toString('hex')
      user.token_created_at = new Date()

      await user.save()

      await Mail.send(
        ['emails.forgot_password'],
        {
          email,
          token: user.token,
          link: `${request.input('redirect_url')}?token=${user.token}`
        },
        message => {
          message
            .to(user.email)
            .from('gildoaraujo@bemol.com.br', 'Gildo Araujo')
            .subject('Recuperação de senha')
        }
      )
    } catch (error) {
      return response.status(error.status).send({error: { message: 'Fail in process to resend Password' }})
    }
  }

  async update({request, response}){
    try {
      const {token, password} = request.all()

      const user = await User.findByOrFail('token', token)

      const tokenExpirated = isAfter(subDays(new Date, 2), user.token_created_at)

      if(tokenExpirated) {
        return response.status(401).send({error: { message: 'Fail in process to reset token expirated' }})
      }

      user.token = null
      user.token_created_at = null

      user.password = password

      await user.save()

    } catch (error) {
      return response.status(error.status).send({error: { message: 'Fail in process to reset Password' }})
    }
  }
}

module.exports = ForgotPasswordController
