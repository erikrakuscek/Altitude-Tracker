#include <stdio.h>
#include "espressif/esp_common.h"
#include "esp/uart.h"

#include "FreeRTOS.h"
#include "task.h"
#include <ssid_config.h>

#include "bmp.c"
#include "mqtt.c"

void user_init(void)
{
    printf("Tracking started!");
    uart_set_baud(0, 115200);

    struct sdk_station_config config = {
        .ssid = WIFI_SSID,
        .password = WIFI_PASS,
    };
    sdk_wifi_station_set_auto_connect(1);
    sdk_wifi_set_opmode(STATION_MODE);
    sdk_wifi_station_set_config(&config);
    sdk_wifi_station_connect();

    bmp280_init();
    mqtt_init();
    
    xTaskCreate(&beat_task, "beat_task", 256, NULL, 2, NULL);
    xTaskCreate(&mqtt_task, "mqtt_task", 1024, NULL, 2, NULL);
    xTaskCreate(&bmp280_task, "bmp_task", 1024, NULL, 2, NULL);
}
