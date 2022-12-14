const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb',
});

/// Users

/**
 * Get a single user from the database given their email.
 */
const getUserWithEmail = (email) => {
  let queryString = `SELECT * FROM users WHERE email = $1;`;
  let queryParams = [email.toLowerCase()];
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows[0]) {
        // console.log(result.rows[0]);
        return result.rows[0];
      }
      // console.log('returning null!');
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 */
const getUserWithId = (id) => {
  let queryParams = [id];
  let queryString = `SELECT * FROM users WHERE id = $1;`;
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows[0]) {
        // console.log(result.rows[0]);
        return result.rows[0];
      }
      // console.log('returning null!');
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 */
const addUser =  function(userObj) {
  // console.log(userObj);
  let queryString = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;
  let queryParams = [userObj.name, userObj.email.toLowerCase(), userObj.password];
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows[0]) {
        // console.log(result.rows[0]);
        return result.rows[0];
      }
      // console.log('returning null!');
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = (guestId, limit = 10) => {
  let queryString = `
  SELECT properties.*, reservations.*, AVG(property_reviews.rating) as "average_rating"
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date DESC
  LIMIT $2;`;
  let queryParams = [guestId, limit];
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows) {
        // console.log(result.rows);
        return result.rows;
      }
      // console.log('returning null!');
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllReservations = getAllReservations;

/// Properties

const getAllProperties = (options, limit = 10) => {
  // console.log(options);
  const queryParams = [];
  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) as "average_rating"
      FROM properties
      JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    const newString = options.city.substring(1, options.city.length -1);
    queryParams.push(`%${newString}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length > 1) {
      queryString += `AND owner_id = $${queryParams.length}`;
    } else {
      queryString += `WHERE owner_id = $${queryParams.length}`;
    }
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    if (queryParams.length > 1) {
      queryString += `AND cost_per_night >= $${queryParams.length} * 100`;
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length} * 100`;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    if (queryParams.length > 1) {
      queryString += `AND cost_per_night <= $${queryParams.length} * 100`;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length} * 100`;
    }
  }

  queryString += `GROUP BY properties.id `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((res) => {
      // console.log(res.rows);
      return res.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = (property) => {
  // console.log(property);
  let queryString = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6 * 100, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`;
  let queryParams = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows[0]) {
        // console.log(result.rows[0]);
        return result.rows[0];
      }
      // console.log('returning null!');
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addProperty = addProperty;
