process.env.NODE_ENV = "test";

const request = require("supertest");
const { response } = require("../app");


const app = require("../app");
const db = require("../db");

let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '12345678',
        'https://amazon.com/hotdog',
        'Asher',
        'Cramer',
        100,
        'Nothing publishers',
        'my first book', 2008)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});

describe("GET /books", function () {
    test("gets the list of books", async function () {
        const response = await request(app).get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
    });
});

describe("GET /books/:isbn", function () {
    test("gets a single book based off of isbn", async function () {
      const response = await request(app)
          .get(`/books/${book_isbn}`)
      expect(response.body.book).toHaveProperty("isbn");
      expect(response.body.book.isbn).toBe(book_isbn);
    });
  
    test("Responds with 404 if no book is found", async function () {
      const response = await request(app)
          .get(`/books/2222`)
      expect(response.statusCode).toBe(404);
    });
  });

desscribe("POST /books", function () {
    test("post a new book", async function () {
        const response = await response(app).post(`/books`).send({
            isbn: '32794782',
          amazon_url: "https://taco.com",
          author: "mctest",
          language: "english",
          pages: 1000,
          publisher: "yeah right",
          title: "amazing times",
          year: 2000
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });

    test("Book does not get created without required items", async function() {
        const response = await (await request(app).post(`/books`)).send({year: 2021});
        expect(response.statusCode).toBe(400);
    });
});

describe("PUT /books/:id", function () {
    test("updates the book based on the id given", async function () {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url: "https://taco.com",
            author: "mctest",
            language: "english",
            pages: 1000,
            publisher: "yeah right",
            title: "amazing update right?",
            year: 2000 
        });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("amazing update right?");
    });

    test("Prevents an invalid book update", function () {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            isbn: '32794782',
            amazon_url: "https://taco.com",
            author: "mctest",
            invalidField: "SHHH, im trying to be added",
            language: "english",
            pages: 1000,
            publisher: "yeah right",
            title: "amazing times",
            year: 2000 
        });
        expect(response.statusCode).toBe(400);
    });

    test("Responds with 404 if no book is found", async function () {
        const response = await request(app)
            .get(`/books/2222`)
        expect(response.statusCode).toBe(404);
      });
})

describe("DELETE /books/:id", function () {
    test("deletes the book requested", async function () {
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.body).toEqual({message: "Book deleted"});
    });
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
    await db.end()
});

