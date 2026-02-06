import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware';
import { UsersController } from './users.controller';
import { createUsersSchema } from './users.schema';

const router = Router();

router.post('/', validate(createUsersSchema), UsersController.create);
router.get('/', UsersController.getAll);

export const usersRouter = router;
