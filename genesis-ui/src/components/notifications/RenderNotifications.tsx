import { Fragment, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { NotificationDao } from '../../db/NotificationDao';
import NotificationDto from '../../db/NotificationDto';
import { AlertType, AlertTypeToTextColor, renderNotification } from './Notificiations';

const dismissedNotesLocalStorage = 'dismissedNotes';

/**
 * Convert set to json string for local storage
 * @param set
 * @returns string representation on the set
 */
function setToString(set: Set<string>) {
  let jsonObject: string[] = [];
  set.forEach((value) => {
    jsonObject.push(value);
  });
  return JSON.stringify(jsonObject);
}

/**
 * load string array in string to a set for local storage
 * @param input a string that represents a string[]
 * @returns a set of strings
 */
function stringToSet(input: string) {
  let inputArray: string[];
  try {
    inputArray = JSON.parse(input);
  } catch (error) {
    console.error(error);
    return new Set<string>();
  }
  if (!Array.isArray(inputArray)) {
    return new Set<string>();
  }
  const set = new Set<string>();
  inputArray.forEach((value) => {
    set.add(value);
  });
  return set;
}

/**
 * Functional component that renders notificions based on data from the notification page and can have dismissible
 * items using localstorage
 *
 * @returns Rendered notifications elements or nothing if there are no notifications
 */
export const RenderNotifications = () => {
  const location = useLocation();
  /**
   *  List of all notification that are enabled
   */
  const [notifications, setNotifications] = useState([] as NotificationDto[]);
  /**
   *  List of all notification that have been dismissed by the user
   */
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set<string>());
  const [notificationDao] = useState(new NotificationDao());

  useEffect(() => {
    notificationDao.watchForChanges(true, (notifications: NotificationDto[]) => {
      setNotifications(notifications);
    });
  }, [notificationDao]);

  useEffect(() => {
    const storedNotes = localStorage.getItem(dismissedNotesLocalStorage);
    if (storedNotes !== null) {
      const dismissedNotifications: Set<string> = stringToSet(storedNotes);
      setDismissedNotifications(dismissedNotifications);
    }
  }, []);

  const elements = notifications.map((note, index) => {
    const match = note.locationRoute.toLowerCase().localeCompare(location.pathname.toLowerCase()) === 0;
    const colorStyle = AlertTypeToTextColor.get(note.type as AlertType);
    if (note.id != null && match && !dismissedNotifications.has(note.id)) {
      return renderNotification(colorStyle, note.type as AlertType, index, note.contents, note.dismissable, () => {
        if (note.id != null) {
          const dismissedNotificationsUpdate = new Set(dismissedNotifications);
          dismissedNotifications.forEach((note) => {
            const found = notifications.find((value) => {
              return value.id === note;
            });
            if (found === undefined) {
              dismissedNotificationsUpdate.delete(note);
            }
          });
          dismissedNotificationsUpdate.add(note.id);
          setDismissedNotifications(dismissedNotificationsUpdate);
          localStorage.setItem(dismissedNotesLocalStorage, setToString(dismissedNotificationsUpdate));
        }
      });
    } else {
      return undefined;
    }
  });
  if (elements === undefined) {
    return <Fragment />;
  }
  return <div>{elements}</div>;
};
