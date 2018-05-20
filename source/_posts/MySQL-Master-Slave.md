---
title: MySQL Master Slave
tags:
  - MySQL
date: 2016-03-26 13:29:21
updated: 2018-04-10 17:41:21
---



## Background
MySQL 主从服务器的作用之一是备份, 配置为从服务器 (slave) 的 MySQL 服务器将主服务器 (master) 发生的修改动作同步过来, 当主服务器发生故障的时候, 从服务器可以迅速替代主服务器提供服务.

关于 MySQL 主从服务器的配置本来非常简单, 但网上的配置教程也让我眼花缭乱, 有的教程使用的服务器版本过旧, 而 MySQL 更新非常快, 以前旧版本的配置方法在新版本上没法正确工作, 另一方面, 为了避免以后遗忘还得在这些令人眼花缭乱的教程中甄选, 特此记录. 

## Prerequisites

本文使用的环境为:

- OS: macOS High Sierra

- MySQL: 5.7.9

- Docker(Optional): 18.03.0-ce-mac59 (23608)

## Solution

### Creating Account

由于从服务器要从主服务器同步数据, 因此必须有可以访问到主服务器的一个 `MySQL` 账户, 从安全和方便管理方面看, 建议为从服务器专门新建一个账户. 命令如下, 在主服务器上运行: 

```mysql master
mysql> grant replication slave on *.* to 'slave'@'%' identified by 'slave';
Query OK, 0 rows affected, 1 warning (0.01 sec)
```

以上语句执行成功, 但有一个 `warning` , 因为使用 `grant` 语句创建用户的方法在新版本已经不建议使用了, 在未来版本可能被移除, 因此可以使用下面两句代替: 

```mysql master
mysql> create user slave identified by 'slave';
Query OK, 0 rows affected (0.01 sec)

mysql> grant replication slave on *.* to slave;
Query OK, 0 rows affected (0.00 sec)
```

### Mofifying Configurations

#### Master Configuration

MySQL 服务器配置文件是 MySQL 服务程序 mysqld 运行时会去读取的配置文件, 在 `*inux` 系统下, 其名字为 `my.cnf` , 在 `windows` 下名字为 `my.ini` , `my.cnf` 文件可以有多个, `mysqld` 读取的顺序可以使用 `mysqld --help | grep my.cnf` 查看: 

```shell
$ mysql --help|grep my.cnf
				  order of preference, my.cnf, $MYSQL_TCP_PORT,
/etc/my.cnf /etc/mysql/my.cnf /usr/local/mysql/etc/my.cnf /opt/mysql/my.cnf ~/.my.cnf 
```

因此可以修改上述中的任何一个文件, 以下将修改 `/etc/my.cnf` 文件, 修改如下: 
	
```conf /etc/my.cnf
[mysqld]
server-id=1000
log-bin=
```

`[mysqld]` 表示配置的一个组, `mysqld` 启动会使用这个组下面的配置, 给主服务器配置个服务器 `id` 为 `12345` , `log-bin=` 表示激活二进制更新日志, 由于 `MySQL` 主从服务器通过二进制更新日志来同步, 所以要激活它, 等号后表示日志存放路径, 缺省表示由 `MySQL` 的默认位置决定. 

#### Slaves Configuration

在 `~/.my.cnf` 或其它 `my.cnf` 配置文件中为从服务器指定一个 `server-id`:

```conf ~/.my.cnf
[mysqld]
server-id=1001
```

登陆从服务器, 配置从服务器 **归属** 的主服务器:

```mysql slaves
mysql> change master to master_host='host', master_user='slave', master_password='slave';
Query OK, 0 rows affected, 2 warnings (0.03 sec)
```

其中:
- `host`: 主服务器所在的 `IP` 地址或域名, 如果是本地则是 `localhost` 
- `master_user` 和 `master_password`: `步骤 1` 中为从服务器创建的账户和密码, 如果该语句执行出现以下错误, 
```text
ERROR 3021 (HY000): This operation cannot be performed with a 
running slave io thread; run STOP SLAVE IO_THREAD FOR CHANNEL '' first.
```
	则说明已经有从服务器在运行, 先要停止它. 
```mysql
mysql> stop slave;
Query OK, 0 rows affected (0.01 sec)
```
	
## Running

为了使修改后的配置文件生效, 使用以下命令重启 MySQL 服务器. 

```shell
// 停止服务器
$ mysqladmin -uroot -p shutdown
Enter password:
// 启动服务器
$ mysqld_safe --user=mysql&
2016-03-26T05:47:02.783806Z mysqld_safe Logging to '/usr/local/mysql/data/log.error'.
2016-03-26T05:47:02.805345Z mysqld_safe Starting mysqld daemon with databases from /usr/local/mysql/data
```

## Result

使用以下命令查看服务器的状态:

```mysql
mysql> show slave status\G;
*************************** 1. row ***************************
			   Slave_IO_State: Waiting for master to send event
				  Master_Host: 139.129.118.26
				  Master_User: slave
				  Master_Port: 3306
				Connect_Retry: 60
			  Master_Log_File: iZ28dfovkdxZ-bin.000001
		  Read_Master_Log_Pos: 154
			   Relay_Log_File: KeZhenxus-MacBook-Pro-relay-bin.000002
				Relay_Log_Pos: 381
		Relay_Master_Log_File: iZ28dfovkdxZ-bin.000001
			 Slave_IO_Running: Yes
			Slave_SQL_Running: Yes
			  Replicate_Do_DB: 
		  Replicate_Ignore_DB: 
		   Replicate_Do_Table: 
	   Replicate_Ignore_Table: 
	  Replicate_Wild_Do_Table: 
  Replicate_Wild_Ignore_Table: 
				   Last_Errno: 0
				   Last_Error: 
				 Skip_Counter: 0
		  Exec_Master_Log_Pos: 154
			  Relay_Log_Space: 604
			  Until_Condition: None
			   Until_Log_File: 
				Until_Log_Pos: 0
		   Master_SSL_Allowed: No
		   Master_SSL_CA_File: 
		   Master_SSL_CA_Path: 
			  Master_SSL_Cert: 
			Master_SSL_Cipher: 
			   Master_SSL_Key: 
		Seconds_Behind_Master: 0
Master_SSL_Verify_Server_Cert: No
				Last_IO_Errno: 0
				Last_IO_Error: 
			   Last_SQL_Errno: 0
			   Last_SQL_Error: 
  Replicate_Ignore_Server_Ids: 
			 Master_Server_Id: 12345
				  Master_UUID: bc6aa90b-f182-11e5-9cb9-00163e001113
			 Master_Info_File: /usr/local/mysql/data/master.info
					SQL_Delay: 0
		  SQL_Remaining_Delay: NULL
	  Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
		   Master_Retry_Count: 86400
				  Master_Bind: 
	  Last_IO_Error_Timestamp: 
	 Last_SQL_Error_Timestamp: 
			   Master_SSL_Crl: 
		   Master_SSL_Crlpath: 
		   Retrieved_Gtid_Set: 
			Executed_Gtid_Set: 
				Auto_Position: 0
		 Replicate_Rewrite_DB: 
				 Channel_Name: 
1 row in set (0.00 sec)

ERROR: 
No query specified
```

其中两句表明配置成功: 
```text
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
```

## Testing

在主服务器上登陆, 创建数据库, 表, 插入数据: 

### Master

```mysql
mysql> create database master_db;
Query OK, 1 row affected (0.00 sec)

mysql> use master_db;
Database changed
mysql> create table master_table(
	-> ii int unsigned primary key auto_increment,
	-> cc char(10));
Query OK, 0 rows affected (0.05 sec)
```

### Slaves

```mysql
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| master_db          |	<------- 出现了
| message            |
| mysql              |
| performance_schema |
| sys                |
| test               |
+--------------------+
```

### Master

```mysql
mysql> insert into master_table(cc) select 'I\'m master';
Query OK, 1 row affected (0.01 sec)
Records: 1  Duplicates: 0  Warnings: 0
```
	
### Slaves

```mysql
mysql> select * from master_table;
+----+------------+
| ii | cc         |
+----+------------+
|  1 | I'm master |
+----+------------+
1 row in set (0.00 sec)
```

### Master

```mysql	
-- 禁用自动提交事务
mysql> set autocommit=off;
Query OK, 0 rows affected (0.00 sec)
-- 开启一个事务
mysql> begin;
Query OK, 0 rows affected (0.00 sec)
-- 插入一行数据
mysql> insert into master_table(cc) select cc from master_table;
Query OK, 1 row affected (0.00 sec)
Records: 1  Duplicates: 0  Warnings: 0
-- 本事务内确认插入
mysql> select * from master_table;
+----+------------+
| ii | cc         |
+----+------------+
|  1 | I'm master |
|  2 | I'm master |
+----+------------+
2 rows in set (0.00 sec)
-- 还没提交事务
```

### Slaves

```mysql
mysql> select * from master_table;
+----+------------+
| ii | cc         |
+----+------------+
|  1 | I'm master |
+----+------------+
1 row in set (0.00 sec)
```
	
没有新的数据

### Master

```mysql
mysql> commit;
Query OK, 0 rows affected (0.01 sec)
```

### Slaves

```mysql
mysql> select * from master_table;
+----+------------+
| ii | cc         |
+----+------------+
|  1 | I'm master |
|  2 | I'm master |
+----+------------+
2 rows in set (0.00 sec)
```

此时从服务器才有新数据

## Using Docker

可以在 [GitHub](https://github.com/kezhenxu94/blog-code/tree/master/mysql-master-slaves) 上获取到 docker-compose 文件, 使用以下命令启动 docker 容器, 待容器运行稳定之后, 就可以得到一个主服务器和两个从服务器;

```shell
$ docker-compose up
```

连接上主服务器:

```shell
$ mysql -uroot -pmaster -h 127.0.0.1 -P3306
```

连接上从服务器:

```shell
$ mysql -uroot -pslave0 -h 127.0.0.1 -P3307 # slave0
$ mysql -uroot -pslave1 -h 127.0.0.1 -P3308 # slave1
```

## Summary

也就是说, 从服务器并不 "盲从" 主服务器, 因为开启一个事务时, 有可能会回滚该事务, 一旦会滚该事务, 那么从服务器的这次修改就白费了, 另外还白白浪费了网络的传输;

根本原因是从服务器是根据主服务器的 "二进制更新日志" (即 `my.cnf` 中配置的 `log-bin`) 来进行同步的, 而主服务器在事务没有提交之前不会将修改更新到 "二进制更新日志" 中, 因此从服务器也就不会收到同步的命令. 
