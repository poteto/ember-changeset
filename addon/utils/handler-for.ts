import ChangesetArrayProxyHandler from 'ember-changeset/classes/ChangesetArrayProxyHandler';
import ChangesetObjectProxyHandler from 'ember-changeset/classes/ChangesetObjectProxyHandler';

// todo: work out how to import Proxy and ProxyHandler types
export default function handlerFor(value: {}): any {
  if (Array.isArray(value)) {
    return new ChangesetArrayProxyHandler(value);
  }
  return new ChangesetObjectProxyHandler(value);
}
