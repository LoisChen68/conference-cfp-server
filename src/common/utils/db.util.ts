import { uuidv7 } from "uuidv7";

export const withId = <T>(data: T): T & { id: string } => ({
  id: uuidv7(),
  ...data,
});
