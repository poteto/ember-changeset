import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | main');

test('saves valid changes', function(assert) {
  visit('/');

  andThen(() => assert.equal(find('#title').text(), 'Hello, Jim Bob!'), 'precondition');
  andThen(() => fillIn('#input-first-name', 'Jimmy'));
  andThen(() => click('#submit-button'));
  andThen(() => assert.equal(find('#title').text(), 'Hello, Jimmy Bob!'), 'should save changes');
});

test('does not save invalid changes', function(assert) {
  visit('/');

  andThen(() => fillIn('#input-first-name', 'a'));
  andThen(() => click('#submit-button'));
  andThen(() => assert.equal(find('#title').text(), 'Hello, Jim Bob!'), 'should not save changes');
});

test('rollback changes', function(assert) {
  visit('/');

  andThen(() => fillIn('#input-first-name', 'Jimmy'));
  andThen(() => fillIn('#input-last-name', 'Schmidt'));
  andThen(() => {
    assert.equal(find('#input-first-name').val(), 'Jimmy', 'precondition - firstName');
    assert.equal(find('#input-last-name').val(), 'Schmidt', 'precondition - lastName');
  });
  andThen(() => click('#cancel-button'));
  andThen(() => {
    assert.equal(find('#input-first-name').val(), 'Jim', 'should rollback firstName');
    assert.equal(find('#input-last-name').val(), 'Bob', 'should rollback lastName');
  });
});
