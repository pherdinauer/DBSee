from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator
import socket
import os


def get_server_ips():
    """Get all IP addresses of the current server"""
    ips = ['localhost', '127.0.0.1', '0.0.0.0', '*.localhost']
    
    try:
        # Get hostname and resolve to IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        if local_ip not in ips:
            ips.append(local_ip)
        
        # Get all network interfaces
        import netifaces
        for interface in netifaces.interfaces():
            try:
                addrs = netifaces.ifaddresses(interface)
                for addr_family in addrs:
                    for addr in addrs[addr_family]:
                        if 'addr' in addr and addr['addr'] not in ips:
                            # Add only valid IP addresses
                            ip = addr['addr']
                            if not ip.startswith('fe80') and ip != '::1':  # Skip IPv6 link-local and loopback
                                ips.append(ip)
            except:
                continue
    except ImportError:
        # Fallback if netifaces is not available
        try:
            # Connect to a remote server to get local IP
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(('8.8.8.8', 80))
                local_ip = s.getsockname()[0]
                if local_ip not in ips:
                    ips.append(local_ip)
        except:
            pass
    
    # Add wildcard for development
    if os.getenv('DEBUG', '').lower() in ['true', '1', 'yes']:
        ips.append('*')
    
    return ips


def get_allowed_origins():
    """Get all possible frontend origins"""
    origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://0.0.0.0:3000'
    ]
    
    # Add current server IPs
    for ip in get_server_ips():
        if ip not in ['localhost', '127.0.0.1', '0.0.0.0', '*.localhost', '*']:
            origins.extend([
                f'http://{ip}:3000',
                f'https://{ip}:3000'
            ])
    
    return origins


class Settings(BaseSettings):
    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "password"
    db_name: str = "test"
    db_min_connections: int = 1
    db_max_connections: int = 10

    # JWT
    jwt_secret_key: str = "default-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # CORS - Auto-detect origins
    allowed_origins: str = ""
    
    @field_validator('allowed_origins', mode='after')
    @classmethod
    def parse_cors_origins(cls, v):
        if not v:  # If empty, use auto-detected origins
            return get_allowed_origins()
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v if isinstance(v, list) else [v]

    # Application
    debug: bool = True
    log_level: str = "info"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Allowed hosts - Auto-detect
    allowed_hosts: str = ""
    
    @field_validator('allowed_hosts', mode='after')
    @classmethod
    def parse_allowed_hosts(cls, v):
        if not v:  # If empty, use auto-detected hosts
            return get_server_ips()
        if isinstance(v, str):
            return [host.strip() for host in v.split(',')]
        return v if isinstance(v, list) else [v]

    # Rate Limiting
    rate_limit_per_minute: int = 100

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings() 