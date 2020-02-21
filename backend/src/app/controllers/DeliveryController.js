import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

import OrderMail from '../jobs/OrderMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  // Delivery list

  async index(req, res) {
    const deliveries = await Delivery.findAll({
      order: ['id'],
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'name'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
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

    const recipientExists = await Recipient.findOne({
      where: { id: recipient_id },
    });

    const deliverymanExists = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!recipientExists && !deliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Recipient and Deliveryman do not exist' });
    }

    if (!recipientExists) {
      return res.status(400).json({ error: 'Recipient does not exist' });
    }

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    const { id, product } = await Delivery.create(req.body);

    // Send email to deliveryman who is responiable for delivery

    await Queue.add(OrderMail.key, {
      deliverymanExists,
      recipientExists,
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

    const deliveryExists = await Delivery.findOne({
      where: { id },
    });

    if (!deliveryExists) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    const recipientExists = await Recipient.findOne({
      where: { id: recipient_id },
    });

    const deliverymanExists = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!recipientExists && !deliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Recipient and Deliveryman do not exist' });
    }

    if (!recipientExists) {
      return res.status(400).json({ error: 'Recipient does not exist' });
    }

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    const { product } = await deliveryExists.update(req.body);

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
