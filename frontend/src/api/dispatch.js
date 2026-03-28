/**
 * All product behavior is named on the server (dispatch events).
 * The UI only forwards event names and JSON-serializable payloads over Sira.
 */
export function createDispatchEnvelope(event, payload) {
  return {
    type: 'dispatch',
    event,
    payload: payload ?? {},
  }
}
