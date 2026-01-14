/**
 * microCMS API Client
 */

const API_KEY = '4BLrec5ppd0jAON4vIdrhQ3Otqz22avy30jl';
const SERVICE_DOMAIN = 'kariyoshi58';
const ENDPOINT = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/stores`;

/**
 * Fetch all stores from microCMS
 * @returns {Promise<Array>} List of stores
 */
async function fetchStores() {
    try {
        const response = await fetch(`${ENDPOINT}?limit=50`, {
            headers: {
                'X-MICROCMS-API-KEY': API_KEY,
            },
        });
        if (!response.ok) {
            throw new Error(`API Request failed: ${response.status}`);
        }
        const data = await response.json();
        return data.contents;
    } catch (error) {
        console.error('Failed to fetch stores:', error);
        throw error;
    }
}

/**
 * Fetch a single store by ID from microCMS
 * @param {string} id - Store ID
 * @returns {Promise<Object>} Store object
 */
async function fetchStore(id) {
    try {
        const response = await fetch(`${ENDPOINT}/${id}`, {
            headers: {
                'X-MICROCMS-API-KEY': API_KEY,
            },
        });
        if (!response.ok) {
            throw new Error(`API Request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch store ${id}:`, error);
        throw error;
    }
}
