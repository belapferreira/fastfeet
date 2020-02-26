import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import DeliveryProblem from '../models/DeliveryProblem';
import Recipient from '../models/Recipient';
import User from '../models/User';
import Notification from '../schemas/Notification';

import CancelationMail from '../jobs/CancelationMail';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
    // List deliveries problems

    async index(req, res) {
      const { page = 1 } = req.query;

      const problems = await DeliveryProblem.findAll({
        order: ['id'],
        attributes: ['id', 'description', 'created_at'],
        include: [
          {
            model: Delivery,
            as: 'delivery',
            attributes: ['product'],
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
            ],
          },
        ],
        limit: 10,
        offset: (page - 1) * 10,
      });

      return res.json(problems);
    }

// List delivery problems by delivery id

    async show(req, res) {
      const { page = 1 } = req.query;

      // Check if delivery exists

      const { delivery_id } = req.params;

      const deliveryExists = await Delivery.findOne({
        where: { id: delivery_id },
      });

      if (!deliveryExists) {
        return res.status(400).json({ error: 'Delivery does not exist' });
      }
      const deliveryProblems = await DeliveryProblem.findAll({
        where: {
          delivery_id,
        },
        order: ['id'],
        attributes: ['id', 'description', 'created_at'],
        include: [
          {
            model: Delivery,
            as: 'delivery',
            attributes: ['product'],
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
            ],
          },
        ],
        limit: 10,
        offset: (page - 1) * 10,
      });

      return res.json(deliveryProblems);
    }

  // Create delivery problem

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // Check if delivery exists

    const { delivery_id } = req.params;

    const deliveryExists = await Delivery.findOne({
      where: { id: delivery_id },
    });

    if (!deliveryExists) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    // Check if delivery has been finished

    if (deliveryExists.end_date !== null && deliveryExists.signature_id !== null) {
      return res.status(400).json({ error: 'The delivery has been finished'});
    }

    // Check if deliveryman exists

    const { description, deliveryman_id } = req.body;

    const deliverymanExists = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    // Check if delivery belongs deliveryman

    const deliveryBelongsDeliveryman = await Delivery.findOne({
      where: { id: delivery_id, deliveryman_id },
    });

    if (!deliveryBelongsDeliveryman) {
      return res
        .status(400)
        .json({ error: 'Delivery does not belong deliveryman' });
    }

    const problem = await DeliveryProblem.create({
      delivery_id,
      description,
      deliveryman_id,
    });

    // Notify administrator about delivery problem

    const administrator = await User.findOne({
      where: { administrator: true },
      attributes: ['id']
    });

    await Notification.create({
      content: `New delivery problem by ${deliverymanExists.name} for delivery ${delivery_id}`,
      user: administrator.id,
    });

    return res.json(problem);
  }

  // Delete delivery by id problem

  async delete(req, res) {
    // Check if deliveryman exists

    const { id } = req.params;

    const deliveryProblemExists = await DeliveryProblem.findOne({
      where: { id },
    });

    if (!deliveryProblemExists) {
      return res.status(400).json({ error: 'Delivery problem does not exist' });
    }

    const delivery = await Delivery.findByPk(deliveryProblemExists.delivery_id, {
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'signature_id'
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
      ],
    });

    // Check if delivery has been finished

    if (delivery.end_date !== null && delivery.signature_id !== null) {
      return res.status(400).json({ error: 'The delivery has been finished'});
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    // Send email to deliveryman who is responsable for delivery

    const deliveryId = delivery.id;

    const deliveryman = delivery.deliveryman;

    const recipient = delivery.recipient;

    const product = delivery.product;

    await Queue.add(CancelationMail.key, {
      deliveryId,
      deliveryman,
      recipient,
      product,
    });

    return res.json(delivery);
  }
}

export default new DeliveryProblemController();
