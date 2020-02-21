import Mail from '../../lib/Mail';

class OrderMail {
  get key() {
    return 'OrderMail';
  }

  async handle({ data }) {
    const { deliverymanExists, recipientExists, product } = data;

    await Mail.sendMail({
      to: `${deliverymanExists.name} <${deliverymanExists.email}>`,
      subject: 'Delivery created',
      template: 'order',
      context: {
        deliveryman: deliverymanExists.name,
        product,
        recipient: recipientExists.name,
      },
    });
  }
}

export default new OrderMail();
