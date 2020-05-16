#include <stdio.h>
#include "espressif/esp_common.h"
#include "esp/uart.h"
#include "FreeRTOS.h"
#include "task.h"
#include "i2c/i2c.h"
#include "bmp280/bmp280.h"

bmp280_t bmp280_dev;
float temperature = 0;
float pressure = 0; 

void bmp280_init() {
    uint8_t i2c = 0;
    uint8_t scl = 14;
    uint8_t sda = 12;

    // vodilo i2c
    i2c_init(i2c, scl, sda, I2C_FREQ_100K);
    gpio_enable(scl, GPIO_OUTPUT);

    // BMP280 nastavitve
    bmp280_params_t params;
    bmp280_init_default_params(&params);
    params.mode = BMP280_MODE_FORCED;
    bmp280_dev.i2c_dev.bus = i2c;
    bmp280_dev.i2c_dev.addr = BMP280_I2C_ADDRESS_0;
    bmp280_init(&bmp280_dev, &params);
}

void bmp280_task(void *pvParameters) {

    while (true) {
        bmp280_force_measurement(&bmp280_dev);

        // če se izvaja meritev, počakamo
        while (bmp280_is_measuring(&bmp280_dev)) {}

        bmp280_read_float(&bmp280_dev, &temperature, &pressure, NULL);

	// počakamo 2 sekundi
        vTaskDelay(pdMS_TO_TICKS(2000));
    }

}
