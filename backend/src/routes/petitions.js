const router = require('express').Router();
const ctrl = require('../controllers/petitionController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { signLimiter } = require('../middlewares/rateLimiter');
const { generateToken, verifyToken } = require('../middlewares/csrf');
const uploadPetition = require('../middlewares/uploadPetition');

router.get('/csrf-token', (req, res) => {
  generateToken(req, res, () => res.json({ csrfToken: req.csrfSigned }));
});
router.get('/public', ctrl.listPublicPetitions);
router.get('/:id', ctrl.getPetition);
router.post('/:id/sign', signLimiter, verifyToken, ctrl.signPetition);
router.post('/', authenticate, isAdmin, uploadPetition, ctrl.createPetition);
router.put('/:id', authenticate, isAdmin, uploadPetition, ctrl.updatePetition);
router.get('/', authenticate, isAdmin, ctrl.listPetitions);
router.delete('/:id', authenticate, isAdmin, ctrl.deletePetition);

module.exports = router;
