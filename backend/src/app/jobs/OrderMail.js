import Mail from '../../lib/Mail';

class OrderMail {
  get key() {
    return 'OrderMail';
  }

  async handle({ data }) {
    const { checkDeliverymanExists, checkRecipientExists, product } = data;

    await Mail.sendMail({
      to: `${checkDeliverymanExists.name} <${checkDeliverymanExists.email}>`,
      subject: 'Delivery created',
      template: 'order',
      context: {
        deliveryman: checkDeliverymanExists.name,
        product,
        recipient: checkRecipientExists.name,
      },
    });
  }
}

export default new OrderMail();
