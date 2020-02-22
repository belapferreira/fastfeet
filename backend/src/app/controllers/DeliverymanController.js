import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  // List deliveryman

  async index(req, res) {
    const { page = 1 } = req.query;

    const deliverymen = await Deliveryman.findAll({
      order: ['id'],
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json(deliverymen);
  }

  // Store deliveryman

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // Check if deliveryman exists

    const deliverymanExists = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman already exists.' });
    }

    const { name, email } = await Deliveryman.create(req.body);

    return res.json({
      name,
      email,
    });
  }

  // Update deliveryman

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      name: Yup.string(),
      email: Yup.string().email(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // Check if deliveryman exists

    const { email, id } = req.body;

    const deliveryman = await Deliveryman.findOne({
      where: { id },
    });

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    if (email && email !== deliveryman.email) {
      const deliverymanExists = await Deliveryman.findOne({ where: { email } });

      if (deliverymanExists) {
        return res.status(400).json({ error: 'Deliveryman already exists.' });
      }
    }

    const { name, avatar_id } = await deliveryman.update(req.body);

    return res.json({
      id,
      name,
      email,
      avatar_id,
    });
  }

  // Delete deliveryman

  async delete(req, res) {
    // Check if deliveryman exists

    const { id } = req.params;

    const deliverymanExists = await Deliveryman.findOne({
      where: { id },
    });

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    await Deliveryman.destroy({ where: { id } });

    return res.json();
  }
}

export default new DeliverymanController();
