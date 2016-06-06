import Ember from 'ember';

const {
  Controller,
  isPresent,
  typeOf
} = Ember;

const validations = {
  firstName(value) {
    return isPresent(value) && value.length > 3;
  }
};

export default Controller.extend({
  actions: {
    submit(changeset) {
      return changeset
        .execute()
        .save();
    },

    rollback(changeset) {
      return changeset.rollback();
    },

    validate(key, newValue, oldValue) {
      let validatorFn = validations[key];

      if (typeOf(validatorFn) === 'function') {
        return validatorFn(newValue, oldValue);
      }
    }
  }
});
