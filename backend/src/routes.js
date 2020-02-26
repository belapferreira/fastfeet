import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import RecipientController from './app/controllers/RecipientController';
import SessionController from './app/controllers/SessionController';
import DeliverymanController from './app/controllers/DeliverymanController';
import FileController from './app/controllers/FileController';
import DeliveryController from './app/controllers/DeliveryController';
import DeliveryManagerController from './app/controllers/DeliveryManagerController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';
import NotificationController from './app/controllers/NotificationController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/sessions', SessionController.store);

routes.get('/deliveryman/deliveries', DeliveryManagerController.index);
routes.get('/deliveryman/:id/deliveries', DeliveryManagerController.show);
routes.put(
  '/deliveryman/:deliveryman_id/deliveries',
  DeliveryManagerController.update
);

routes.post('/files/signature', upload.single('file'), FileController.store);

routes.post('/delivery/:delivery_id/problems', DeliveryProblemController.store);

routes.use(authMiddleware);

routes.post('/users', UserController.store);
routes.put('/users', UserController.update);

routes.post('/recipients', RecipientController.store);
routes.put('/recipients', RecipientController.update);

routes.post('/deliverymen', DeliverymanController.store);
routes.put('/deliverymen', DeliverymanController.update);
routes.get('/deliverymen', DeliverymanController.index);
routes.delete('/deliverymen/:id', DeliverymanController.delete);

routes.post('/files', upload.single('file'), FileController.store);

routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries', DeliveryController.update);
routes.get('/deliveries', DeliveryController.index);
routes.delete('/deliveries/:id', DeliveryController.delete);

routes.get('/delivery/problems', DeliveryProblemController.index);
routes.get('/delivery/:delivery_id/problems', DeliveryProblemController.show);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

export default routes;
