import { removePassword } from "../utils/password";
import * as serviceFunctions from "../services/user.service";

jest.mock("../services/user.service");

const userByEmailMock = serviceFunctions.getUserByEmail as jest.Mock;

describe("Service Tests",  () => {

  it('Should return the correct user', async () => {

    userByEmailMock.mockResolvedValue({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'USER',
      createdAt: "2026-04-16T00:00:00.000Z",
      emailVerified: true
    });

    const user = await userByEmailMock('john@gmail.com')

    expect(user).toEqual({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      password: 'password123',
      role: 'USER',
      createdAt: "2026-04-16T00:00:00.000Z",
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
      role: 'USER',
      createdAt: "2026-04-16T00:00:00.000Z",
      emailVerified: true
    });

    const user = await userByEmailMock('john@gmail.com');
    const userObjectWithoutPassword = removePassword(user);
    expect(userObjectWithoutPassword).not.toHaveProperty('password');
    expect(userObjectWithoutPassword).toEqual({
      id: '12345',
      email: 'john@gmail.com',
      name: 'John Doe',
      role: 'USER',
      createdAt: "2026-04-16T00:00:00.000Z",
      emailVerified: true
    });
  })

})

