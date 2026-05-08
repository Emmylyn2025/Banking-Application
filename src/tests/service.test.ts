import { removePassword } from "../utils/password";
import * as serviceFunctions from "../services/user.service";
import removeSome from "../utils/removeUserFields";
import { userRemoval } from "../types/types";

jest.mock("../services/user.service");

const userByEmailMock = serviceFunctions.getUserByEmail as jest.MockedFunction<typeof serviceFunctions.getUserByEmail>;
const userByIdMock = serviceFunctions.getUserById as jest.MockedFunction<typeof serviceFunctions.getUserById>;

describe("Service Tests",  () => {

  it('Should return the correct user', async () => {

    userByEmailMock.mockResolvedValue({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      emailVerified: true
    });

    const user = await userByEmailMock('john@gmail.com')

    expect(user).toEqual({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      emailVerified: true
    });

    expect(userByEmailMock).toHaveBeenCalledWith('john@gmail.com');
  });


  it('It should remove the password field from the user object', async () => {

    userByEmailMock.mockResolvedValue({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      emailVerified: true
    });

    const user = await userByEmailMock('john@gmail.com');
    const userObjectWithoutPassword = removePassword<userRemoval>(user as userRemoval);
    expect(userObjectWithoutPassword).not.toHaveProperty('password');
    expect(userObjectWithoutPassword).toEqual({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      role: 'user',
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      emailVerified: true
    });
  })


  it("It should return the correct user by ID and also test the removal of some fields", async () => {
    userByIdMock.mockResolvedValue({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      emailVerified: true
    });

    const user = await userByIdMock('12345');
    const userObjectWithoutSomeFields = removeSome(user as any);

    expect(userObjectWithoutSomeFields).toEqual({
      id: '12345',
      role: 'user'
    });

    expect(userObjectWithoutSomeFields).not.toHaveProperty('password');
    expect(userObjectWithoutSomeFields).not.toHaveProperty('emailVerified');
    expect(userObjectWithoutSomeFields).not.toHaveProperty('email');
    expect(userObjectWithoutSomeFields).not.toHaveProperty('createdAt');
    expect(userObjectWithoutSomeFields).not.toHaveProperty('name');

    expect(userByIdMock).toHaveBeenCalledWith('12345');


    expect(user).toEqual({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'user',
      createdAt: new Date("2026-04-16T00:00:00.000Z"),
      emailVerified: true
    });
  });


  it("It should return null if user is not found", async () => {
    userByIdMock.mockResolvedValue(null);

    const user = await userByIdMock('12345');

    expect(user).toBeNull();
  })

})

