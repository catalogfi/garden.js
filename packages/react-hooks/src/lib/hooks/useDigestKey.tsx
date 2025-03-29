import { DigestKey } from '@gardenfi/utils';
import { DIGEST_KEY, STORE_NAME, VERSION } from '../constants';
import { useEffect, useState } from 'react';
import { DB_NAME } from '../constants';

export const useDigestKey = () => {
  const [digestKey, setDigestKey] = useState<DigestKey>();

  //Initialize digest key
  useEffect(() => {
    if (!indexedDB) return;

    const request = indexedDB.open(DB_NAME, VERSION);
    request.onerror = () => {
      console.error("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = (event: Event) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(DIGEST_KEY);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          //already exists
          console.log('digestKey already exists:', getRequest.result.value);
          const digestKey = DigestKey.from(getRequest.result.value);
          if (!digestKey.error) setDigestKey(digestKey.val);

          //if not valid, generate new digest key and set
          if (digestKey.error) {
            const newValue = DigestKey.generateRandom();
            store.put({ id: DIGEST_KEY, value: newValue.val.digestKey });
            console.log('digestKey added:', newValue);
            setDigestKey(DigestKey.from(newValue.val.digestKey).val);
          }
        } else {
          const newValue = DigestKey.generateRandom();
          store.put({ id: DIGEST_KEY, value: newValue.val.digestKey });
          console.log('digestKey added:', newValue);
          setDigestKey(DigestKey.from(newValue.val.digestKey).val);
        }
      };

      transaction.oncomplete = () => {
        console.log('Data added successfully');
      };

      transaction.onerror = (error) => {
        console.error('Error adding data:', error);
      };
    };
  }, []);

  return { digestKey };
};
