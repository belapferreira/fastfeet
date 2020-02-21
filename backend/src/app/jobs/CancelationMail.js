import Mail from '../../lib/Mail';

class CancelationMail {
  get key() {
    return 'CancelationMail';
  }

  async handle({ data }) {
    const { deliveryman, recipient, product, deliveryId } = data;

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'Delivery canceled',
      template: 'cancelation',
      context: {
        delivery_id: deliveryId,
        deliveryman: deliveryman.name,
        product,
        recipient: recipient.name,
      },
    });
  }
}

export default new CancelationMail();
