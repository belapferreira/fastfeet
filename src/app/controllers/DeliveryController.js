import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

import OrderMail from '../jobs/OrderMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  // Delivery list

  async index(req, res) {
    const deliveries = await Delivery.findAll({
      order: ['id'],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
      ],
      attributes: [
        'id',
        'product',
        'recipient_id',
        'deliveryman_id',
        'signature_id',
        'canceled_at',
        'start_date',
        'end_date',
      ],
    });

    return res.json(deliveries);
  }

  // Create delivery

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { recipient_id, deliveryman_id } = req.body;

    const checkRecipientExists = await Recipient.findOne({
      where: { id: recipient_id },
    });

    const checkDeliverymanExists = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!checkRecipientExists && !checkDeliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Recipient and Deliveryman do not exist' });
    }

    if (!checkRecipientExists) {
      return res.status(400).json({ error: 'Recipient does not exist' });
    }

    if (!checkDeliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    const { id, product } = await Delivery.create(req.body);

    // Send email to deliveryman who is responiable for delivery

    await Queue.add(OrderMail.key, {
      checkDeliverymanExists,
      checkRecipientExists,
      product,
    });

    return res.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  // Update delivery

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, recipient_id, deliveryman_id } = req.body;

    const delivery = await Delivery.findOne({
      where: { id },
    });

    const checkRecipientExists = await Recipient.findOne({
      where: { id: recipient_id },
    });

    const checkDeliverymanExists = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!checkRecipientExists && !checkDeliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Recipient and Deliveryman do not exist' });
    }

    if (!checkRecipientExists) {
      return res.status(400).json({ error: 'Recipient does not exist' });
    }

    if (!checkDeliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    const { product } = await delivery.update(req.body);

    return res.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  // Delete delivery

  async delete(req, res) {
    const { id } = req.params;

    const deliveryExists = await Delivery.findOne({
      where: { id },
    });

    if (!deliveryExists) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    await Delivery.destroy({ where: { id } });

    return res.json();
  }
}

export default new DeliveryController();
